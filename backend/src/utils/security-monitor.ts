/**
 * Security Monitoring and Alerting System
 * Monitors for suspicious activities and potential security threats
 */
import logger from './logger.js';
import { getRedisClient } from '../config/redis.js';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import axios from 'axios';

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private failedLoginLimiter: RateLimiterRedis;
  private suspiciousIPs: Map<string, number> = new Map(); // Map IP to timestamp when it was marked suspicious
  private alertEndpoint: string | null = null;
  private suspiciousIPExpiryTime: number = 30 * 60 * 1000; // 30 minutes in milliseconds

  constructor() {
    // Initialize Redis-based monitoring
    const redis = getRedisClient();

    // Configure SIEM integration endpoint from environment
    this.alertEndpoint = process.env.SECURITY_ALERT_ENDPOINT || null;

    // Setup failed login tracker - 10 failures in 10 minutes triggers monitoring (increased from 5)
    this.failedLoginLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'security:failed-logins',
      points: 10, // Increased from 5 to be more lenient
      duration: 60 * 10, // 10 minutes
    });

    // Start a cleanup interval to remove expired suspicious IPs
    setInterval(() => this.cleanupSuspiciousIPs(), 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Clean up expired suspicious IPs
   */
  private cleanupSuspiciousIPs(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [ip, timestamp] of this.suspiciousIPs.entries()) {
      if (now - timestamp > this.suspiciousIPExpiryTime) {
        this.suspiciousIPs.delete(ip);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.info(`Cleaned up ${expiredCount} expired suspicious IPs`);
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Track failed login attempts
   * @param userId User ID or email
   * @param ip IP address
   */
  public async trackFailedLogin(userId: string, ip: string): Promise<void> {
    // Skip for local development IPs or in development mode
    if (process.env.NODE_ENV === 'development' ||
        this.isPrivateIP(ip)) {
      logger.info(`Security: Skipping failed login tracking in development for ${userId} from ${ip}`);
      return;
    }

    try {
      const res = await this.failedLoginLimiter.consume(`${ip}:${userId}`);

      // If we've reached 5+ failed attempts, log it
      if (res.consumedPoints >= 5) {
        logger.warn(
          `Security: Multiple failed login attempts for user ${userId} from IP ${ip}. ` +
          `Attempt ${res.consumedPoints} of 10 before lockout.`
        );
      }

      // If we've hit the limit, mark as suspicious
      if (res.consumedPoints >= 10) {
        this.markSuspiciousActivity({
          type: 'failed-login',
          userId,
          ip,
          attempts: res.consumedPoints,
          timestamp: new Date()
        });
      }
    } catch (err) {
      // The IP is already blocked
      this.markSuspiciousActivity({
        type: 'blocked-login',
        userId,
        ip,
        timestamp: new Date()
      });
    }
  }

  /**
   * Check if an IP is a private/local network address
   * @param ip IP address to check
   */
  private isPrivateIP(ip: string): boolean {
    // Check for localhost and common private network patterns
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return true;
    }

    // Check for IPv4 private networks
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.') ||
        ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('172.19.') ||
        ip.startsWith('172.2') || ip.startsWith('172.30.') || ip.startsWith('172.31.')) {
      return true;
    }

    // Check for IPv6 private networks
    if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) {
      return true;
    }

    // Check for IPv4-mapped IPv6 addresses
    if (ip.startsWith('::ffff:')) {
      const ipv4Part = ip.substring(7);
      if (ipv4Part.startsWith('10.') || ipv4Part.startsWith('192.168.') ||
          (ipv4Part.startsWith('172.') && parseInt(ipv4Part.split('.')[1]) >= 16 && parseInt(ipv4Part.split('.')[1]) <= 31)) {
        return true;
      }

      // Check for localhost in IPv4-mapped IPv6
      if (ipv4Part === '127.0.0.1') {
        return true;
      }
    }

    return false;
  }

  /**
   * Track token or API usage anomalies
   * @param userId User ID
   * @param ip IP address
   * @param resource Resource being accessed
   */
  public async trackApiAnomaly(
    userId: string,
    ip: string,
    resource: string
  ): Promise<void> {
    // Skip for local development IPs or in development mode
    if (process.env.NODE_ENV === 'development' ||
        this.isPrivateIP(ip)) {
      return;
    }

    // For now, just log the anomaly but don't mark the IP as suspicious
    // This prevents legitimate users from being blocked
    logger.warn(`API anomaly detected: User ${userId} from IP ${ip} accessing ${resource}`);

    // Only mark as suspicious if it's a critical resource or a pattern of abuse
    // For now, we're disabling this to prevent false positives
    /*
    this.markSuspiciousActivity({
      type: 'api-anomaly',
      userId,
      ip,
      resource,
      timestamp: new Date()
    });
    */
  }

  /**
   * Mark suspicious activity for investigation
   * @param activity Details of the suspicious activity
   */
  private async markSuspiciousActivity(activity: any): Promise<void> {
    // Skip for private IPs or in development mode
    if (process.env.NODE_ENV === 'development' ||
        (activity.ip && this.isPrivateIP(activity.ip))) {
      return;
    }

    // Log the activity
    logger.warn(`Security alert: ${activity.type} detected for IP ${activity.ip}`);

    // Store IP in suspicious list with current timestamp
    if (activity.ip) {
      this.suspiciousIPs.set(activity.ip, Date.now());
      logger.info(`Added IP ${activity.ip} to suspicious list (will expire in 30 minutes)`);
    }

    // Store in Redis for persistence and sharing across instances
    const redis = getRedisClient();
    const activityKey = `security:alert:${Date.now()}`;
    const activityData = JSON.stringify(activity);
    // Set with expiration time of 1 day (reduced from 7 days)
    await redis.setex(activityKey, 60 * 60 * 24, activityData);

    // Send to SIEM or security monitoring system if configured
    this.sendSecurityAlert(activity);
  }

  /**
   * Check if an IP is suspicious
   * @param ip IP address to check
   */
  public isSuspiciousIP(ip: string): boolean {
    // Always allow private network IPs
    if (this.isPrivateIP(ip)) {
      return false;
    }

    // Check if IP is in the suspicious list and not expired
    if (this.suspiciousIPs.has(ip)) {
      const timestamp = this.suspiciousIPs.get(ip);
      const now = Date.now();

      // If the IP has been in the suspicious list for more than the expiry time, remove it
      if (now - timestamp > this.suspiciousIPExpiryTime) {
        this.suspiciousIPs.delete(ip);
        logger.info(`Removed expired suspicious IP: ${ip}`);
        return false;
      }

      return true;
    }

    return false;
  }

  /**
   * Send security alert to monitoring systems
   * @param activity Details of the activity
   */
  private async sendSecurityAlert(activity: any): Promise<void> {
    // If no alert endpoint is configured, just log and return
    if (!this.alertEndpoint) {
      return;
    }

    try {
      // Send to alert endpoint (SIEM, monitoring service, etc.)
      await axios.post(this.alertEndpoint, {
        event: 'security-alert',
        severity: activity.type === 'blocked-login' ? 'high' : 'medium',
        source: 'tmr-api',
        details: activity,
        environment: process.env.NODE_ENV || 'development'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.SECURITY_ALERT_API_KEY || ''
        }
      });

      logger.info(`Security alert sent to monitoring service for ${activity.type}`);
    } catch (error) {
      logger.error(`Failed to send security alert: ${(error as Error).message}`);
    }
  }
}

// Export singleton instance
export default SecurityMonitor.getInstance();
