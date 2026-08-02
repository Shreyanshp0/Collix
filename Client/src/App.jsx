import { Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/common/PrivateRoute.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import ThemeWrapper from './layouts/ThemeWrapper.jsx';
import GroupChatPage from './pages/GroupChatPage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

function App() {
  return (
    <ThemeWrapper>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:groupId" element={<GroupChatPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeWrapper>
  );
}

export default App;
