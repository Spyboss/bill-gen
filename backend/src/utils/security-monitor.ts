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
  private suspiciousIPs: Set<string> = new Set();
  private alertEndpoint: string | null = null;
  
  constructor() {
    // Initialize Redis-based monitoring
    const redis = getRedisClient();
    
    // Configure SIEM integration endpoint from environment
    this.alertEndpoint = process.env.SECURITY_ALERT_ENDPOINT || null;
    
    // Setup failed login tracker - 5 failures in 10 minutes triggers monitoring
    this.failedLoginLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'security:failed-logins',
      points: 5,
      duration: 60 * 10, // 10 minutes
    });
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
        ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' ||
        ip.startsWith('192.168.') || ip.startsWith('10.')) {
      logger.info(`Security: Skipping failed login tracking in development for ${userId} from ${ip}`);
      return;
    }
    
    try {
      const res = await this.failedLoginLimiter.consume(`${ip}:${userId}`);
      
      // If we've reached 3+ failed attempts, log it
      if (res.consumedPoints >= 3) {
        logger.warn(
          `Security: Multiple failed login attempts for user ${userId} from IP ${ip}. ` +
          `Attempt ${res.consumedPoints} of 5 before lockout.`
        );
      }
      
      // If we've hit the limit, mark as suspicious
      if (res.consumedPoints >= 5) {
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
        ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' ||
        ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return;
    }
    
    // Track sudden spikes in API usage (implement more sophisticated detection as needed)
    // This is a placeholder for more comprehensive anomaly detection
    this.markSuspiciousActivity({
      type: 'api-anomaly',
      userId,
      ip,
      resource,
      timestamp: new Date()
    });
  }
  
  /**
   * Mark suspicious activity for investigation
   * @param activity Details of the suspicious activity
   */
  private async markSuspiciousActivity(activity: any): Promise<void> {
    // Skip for development IPs in development mode
    if (process.env.NODE_ENV === 'development' &&
        (activity.ip === '127.0.0.1' || activity.ip === '::1' || 
         activity.ip === 'localhost' || 
         (activity.ip && (activity.ip.startsWith('192.168.') || 
                         activity.ip.startsWith('10.'))))) {
      return;
    }
    
    // Log the activity
    logger.warn(`Security alert: ${activity.type} detected`);
    
    // Store IP in suspicious list (except localhost in development)
    if (activity.ip && !(process.env.NODE_ENV === 'development' && 
       (activity.ip === '127.0.0.1' || activity.ip === '::1' || 
        activity.ip === 'localhost'))) {
      this.suspiciousIPs.add(activity.ip);
    }
    
    // Store in Redis for persistence and sharing across instances
    const redis = getRedisClient();
    const activityKey = `security:alert:${Date.now()}`;
    const activityData = JSON.stringify(activity);
    // Set with expiration time of 7 days
    await redis.setex(activityKey, 60 * 60 * 24 * 7, activityData);
    
    // Send to SIEM or security monitoring system if configured
    this.sendSecurityAlert(activity);
  }
  
  /**
   * Check if an IP is suspicious
   * @param ip IP address to check
   */
  public isSuspiciousIP(ip: string): boolean {
    // Always allow localhost and private network IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' ||
        ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return false;
    }
    
    return this.suspiciousIPs.has(ip);
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
        source: 'bill-gen-api',
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