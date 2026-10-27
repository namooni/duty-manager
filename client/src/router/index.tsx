import {createHashRouter, Navigate} from 'react-router-dom';
import {CommonLayout} from '@/components/layouts/CommonLayout';
import {SchedulePage} from '@/pages/schedule/SchedulePage';
import {DutiesPage} from '@/pages/duties/DutiesPage';
import {EmployeesPage} from '@/pages/employees/EmployeesPage';
export const router = createHashRouter([
  {
    element: <CommonLayout />,
    children: [
      {path: '/', element: <SchedulePage />},
      {path: '/duties', element: <DutiesPage />},
      {path: '/employees', element: <EmployeesPage />},
      {path: '*', element: <Navigate to="/" replace />},
    ],
  },
]);
