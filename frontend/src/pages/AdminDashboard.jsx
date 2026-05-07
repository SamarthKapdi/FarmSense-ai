import React, { useState } from 'react';
import AdminLayout from '../layouts/admin/AdminLayout';
import OverviewPage from './admin/OverviewPage';
import DiseaseSurveillancePage from './admin/DiseaseSurveillancePage';
import UserManagementPage from './admin/UserManagementPage';
import AIMonitoringPage from './admin/AIMonitoringPage';
import SystemInfrastructurePage from './admin/SystemInfrastructurePage';
import PlatformConfigPage from './admin/PlatformConfigPage';

export default function AdminDashboard({ onNavigate }) {
    const [activeSection, setActiveSection] = useState('overview');

    const renderSection = () => {
        switch (activeSection) {
            case 'overview':
                return <OverviewPage />;
            case 'surveillance':
                return <DiseaseSurveillancePage />;
            case 'users':
                return <UserManagementPage />;
            case 'ai':
                return <AIMonitoringPage />;
            case 'infrastructure':
                return <SystemInfrastructurePage />;
            case 'config':
                return <PlatformConfigPage />;
            default:
                return <OverviewPage />;
        }
    };

    return (
        <AdminLayout 
            activeSection={activeSection} 
            setActiveSection={setActiveSection}
            onLogout={() => onNavigate('landing')}
        >
            {renderSection()}
        </AdminLayout>
    );
}
