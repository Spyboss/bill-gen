import React from 'react';
import { Tabs, Card } from 'antd';
import { UserOutlined, LockOutlined, SettingOutlined, HistoryOutlined } from '@ant-design/icons';
import UserProfile from '../../components/user/UserProfile';
import PasswordChange from '../../components/user/PasswordChange';
import UserPreferences from '../../components/user/UserPreferences';
import UserActivity from '../../components/user/UserActivity';

const { TabPane } = Tabs;

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <Card className="shadow-sm">
            <Tabs defaultActiveKey="profile" size="large" className="user-profile-tabs">
              <TabPane
                tab={
                  <span>
                    <UserOutlined />
                    Profile
                  </span>
                }
                key="profile"
              >
                <UserProfile />
              </TabPane>
              
              <TabPane
                tab={
                  <span>
                    <LockOutlined />
                    Security
                  </span>
                }
                key="security"
              >
                <PasswordChange />
              </TabPane>
              
              <TabPane
                tab={
                  <span>
                    <SettingOutlined />
                    Preferences
                  </span>
                }
                key="preferences"
              >
                <UserPreferences />
              </TabPane>
              
              <TabPane
                tab={
                  <span>
                    <HistoryOutlined />
                    Activity
                  </span>
                }
                key="activity"
              >
                <UserActivity />
              </TabPane>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
