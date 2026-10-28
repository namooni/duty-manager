import {createHashRouter, Navigate} from 'react-router-dom';
import {CommonLayout} from '@/components/layouts/CommonLayout';
import {HomePage} from '@/pages/home/HomePage';
import {SchedulePage} from '@/pages/schedule/SchedulePage';
import {DutyDetailsPage} from '@/pages/duties/DutyDetailsPage';
import {DutiesPage} from '@/pages/duties/DutiesPage';
import {EmployeesPage} from '@/pages/employees/EmployeesPage';
export const router = createHashRouter([
  {
    element: <CommonLayout />,
    children: [
      {path: '/', element: <HomePage />},
      {path: '/schedule', element: <SchedulePage />},
      {path: '/duties', element: <DutiesPage />},
      {path: '/duties/:dutyId', element: <DutyDetailsPage />},
      {path: '/employees', element: <EmployeesPage />},
      {path: '*', element: <Navigate to="/" replace />},
    ],
  },
]);
