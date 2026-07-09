import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Shell } from './components/Shell';
import AuthScreen from './screens/AuthScreen';
import OnboardingWizard from './screens/OnboardingWizard';
import HomeScreen from './screens/HomeScreen';
import MedicationsScreen from './screens/MedicationsScreen';
import AppointmentsScreen from './screens/AppointmentsScreen';
import TasksScreen from './screens/TasksScreen';
import VisitReportScreen from './screens/VisitReportScreen';
import AgentChatScreen from './screens/AgentChatScreen';
import AlertsScreen from './screens/AlertsScreen';
import FamilyScreen from './screens/FamilyScreen';
import SettingsScreen from './screens/SettingsScreen';
import MeasurementsScreen from './screens/MeasurementsScreen';
import ShiftsScreen from './screens/ShiftsScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import ReportsScreen from './screens/ReportsScreen';
import AutomationsBoard from './screens/AutomationsBoard';
import AuditLogScreen from './screens/AuditLogScreen';
import AdminMetricsScreen from './screens/AdminMetricsScreen';

const SCREENS = {
  home: HomeScreen,
  medications: MedicationsScreen,
  appointments: AppointmentsScreen,
  tasks: TasksScreen,
  visitReport: VisitReportScreen,
  agent: AgentChatScreen,
  alerts: AlertsScreen,
  family: FamilyScreen,
  settings: SettingsScreen,
  measurements: MeasurementsScreen,
  shifts: ShiftsScreen,
  documents: DocumentsScreen,
  reports: ReportsScreen,
  automations: AutomationsBoard,
  auditLog: AuditLogScreen,
  adminMetrics: AdminMetricsScreen,
};

function Root() {
  const { session, currentUser, currentFamily } = useApp();
  const [active, setActive] = useState('home');

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', session.fontScale || 1);
    document.documentElement.setAttribute('data-contrast', session.contrast || 'normal');
  }, [session.fontScale, session.contrast]);

  if (!currentUser) return <AuthScreen />;
  if (!currentFamily) return <OnboardingWizard />;

  const Screen = SCREENS[active] || HomeScreen;
  return (
    <Shell active={active} onNavigate={setActive}>
      <Screen navigate={setActive} />
    </Shell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
