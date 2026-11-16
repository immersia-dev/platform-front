import { Navigate, Route, Routes } from 'react-router-dom';

import { RequireAuth, RequireRoles, RoleHomeRedirect } from './auth/RouteGuards';
import AppShell from './components/AppShell';
import DevProfiles from './pages/DevProfiles';
import GroupDetails from './pages/GroupDetails';
import Groups from './pages/Groups';
import Login from './pages/Login';
import OrganizationDetails from './pages/OrganizationDetails';
import Organizations from './pages/Organizations';
import Overview from './pages/Overview';
import Profile from './pages/Profile';
import Studies from './pages/Studies';
import StudyTrackDetails from './pages/StudyTrackDetails';
import StudentDetails from './pages/StudentDetails';
import Students from './pages/Students';
import TrainingResults from './pages/TrainingResults';
import Users from './pages/Users';
import { isDemoMode } from './lib/demoMode';
import PlatformApp from './plataforma/PlatformApp';

export default function App() {
  // contra a API real (platform-back) a plataforma usa as telas novas; o modo demonstração mantém a vitrine
  if (!isDemoMode) return <PlatformApp />;

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dev" element={<DevProfiles />} />
      <Route path="/dev/:roleSlug" element={<DevProfiles />} />
      <Route path="/gallery" element={<Navigate to="/app/studies" replace />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<RoleHomeRedirect />} />

        <Route
          path="overview"
          element={
            <RequireRoles roles={['super_admin', 'org_admin', 'instructor']}>
              <Overview />
            </RequireRoles>
          }
        />

        <Route
          path="organizations"
          element={
            <RequireRoles roles={['super_admin']}>
              <Organizations />
            </RequireRoles>
          }
        />

        <Route
          path="organizations/:organizationId"
          element={
            <RequireRoles roles={['super_admin']}>
              <OrganizationDetails />
            </RequireRoles>
          }
        />

        <Route
          path="users"
          element={
            <RequireRoles roles={['super_admin', 'org_admin']}>
              <Users />
            </RequireRoles>
          }
        />

        <Route
          path="studies"
          element={
            <RequireRoles roles={['super_admin', 'org_admin', 'instructor', 'learner']}>
              <Studies />
            </RequireRoles>
          }
        />

        <Route
          path="studies/:trackId"
          element={
            <RequireRoles roles={['super_admin', 'org_admin', 'instructor', 'learner']}>
              <StudyTrackDetails />
            </RequireRoles>
          }
        />

        <Route path="trainings" element={<Navigate to="/app/studies" replace />} />

        <Route
          path="trainings/:moduleId/:trainingId/results"
          element={
            <RequireRoles roles={['super_admin', 'org_admin', 'instructor']}>
              <TrainingResults />
            </RequireRoles>
          }
        />

        <Route
          path="groups"
          element={
            <RequireRoles roles={['org_admin', 'instructor']}>
              <Groups />
            </RequireRoles>
          }
        />

        <Route
          path="groups/:groupId"
          element={
            <RequireRoles roles={['org_admin', 'instructor']}>
              <GroupDetails />
            </RequireRoles>
          }
        />

        <Route
          path="students"
          element={
            <RequireRoles roles={['org_admin', 'instructor']}>
              <Students />
            </RequireRoles>
          }
        />

        <Route
          path="students/:studentId"
          element={
            <RequireRoles roles={['super_admin', 'org_admin', 'instructor']}>
              <StudentDetails />
            </RequireRoles>
          }
        />

        <Route
          path="profile"
          element={
            <RequireRoles roles={['super_admin', 'org_admin', 'instructor', 'learner']}>
              <Profile />
            </RequireRoles>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
