import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Alert, Progress } from 'antd';
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone, SafetyOutlined } from '@ant-design/icons';
import apiClient from '../../utils/apiClient';

const { Title, Text } = Typography;

const PasswordChange = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    return Math.min(strength, 100);
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 40) return '#ff4d4f';
    if (strength < 70) return '#faad14';
    return '#52c41a';
  };

  const getPasswordStrengthText = (strength) => {
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      await apiClient.put('/api/auth/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      
      message.success('Password changed successfully. You will be redirected to login.');
      
      // Clear form
      form.resetFields();
      setPasswordStrength(0);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } catch (error) {
      console.error('Password change error:', error);
      message.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="shadow-sm">
        <div className="mb-6">
          <Title level={3} className="mb-2">
            <LockOutlined className="mr-2" />
            Change Password
          </Title>
          <Text type="secondary">
            Update your password to keep your account secure
          </Text>
        </div>

        <Alert
          message="Security Notice"
          description="After changing your password, you will be logged out and need to sign in again with your new password."
          type="info"
          showIcon
          className="mb-6"
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[
              { required: true, message: 'Please enter your current password' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter current password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              className="dark:bg-gray-800 dark:border-gray-600"
            />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 8, message: 'Password must be at least 8 characters long' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
              }
            ]}
          >
            <Input.Password
              prefix={<SafetyOutlined />}
              placeholder="Enter new password"
              onChange={handlePasswordChange}
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              className="dark:bg-gray-800 dark:border-gray-600"
            />
          </Form.Item>

          {passwordStrength > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <Text className="text-sm">Password Strength</Text>
                <Text className="text-sm" style={{ color: getPasswordStrengthColor(passwordStrength) }}>
                  {getPasswordStrengthText(passwordStrength)}
                </Text>
              </div>
              <Progress
                percent={passwordStrength}
                strokeColor={getPasswordStrengthColor(passwordStrength)}
                showInfo={false}
                size="small"
              />
            </div>
          )}

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<SafetyOutlined />}
              placeholder="Confirm new password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              className="dark:bg-gray-800 dark:border-gray-600"
            />
          </Form.Item>

          <div className="pt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              icon={<LockOutlined />}
            >
              Change Password
            </Button>
          </div>
        </Form>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Title level={5} className="mb-2">Password Requirements:</Title>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Contains at least one lowercase letter</li>
            <li>• Contains at least one uppercase letter</li>
            <li>• Contains at least one number</li>
            <li>• Special characters are recommended</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default PasswordChange;
