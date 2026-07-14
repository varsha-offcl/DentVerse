import { Routes, Route, Navigate } from "react-router-dom";
import { AppStateProvider } from "@/context/AppStateContext";
import RequireRole from "@/components/shared/RequireRole";
import DoctorShell from "@/components/shared/DoctorShell";
import ReceptionistShell from "@/components/shared/ReceptionistShell";
import AdminShell from "@/components/shared/AdminShell";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import JoinStaff from "@/pages/JoinStaff";

// Doctor
import Dashboard from "@/pages/Dashboard";
import CalendarView from "@/pages/CalendarView";
import Requests from "@/pages/Requests";
import Confirmed from "@/pages/Confirmed";
import Cancelled from "@/pages/Cancelled";
import PatientList from "@/pages/PatientList";
import Notifications from "@/pages/Notifications";
import Availability from "@/pages/Availability";
import PatientWorkspace from "@/pages/PatientWorkspace";
import VoiceToChart from "@/pages/VoiceToChart";
import Prescription from "@/pages/Prescription";
import TreatmentPlan from "@/pages/TreatmentPlan";

// Receptionist
import ReceptionDashboard from "@/pages/reception/Dashboard";
import AppointmentManagement from "@/pages/reception/AppointmentManagement";
import CheckInBoard from "@/pages/reception/CheckInBoard";
import ReceptionRequests from "@/pages/reception/Requests";
import RescheduleRequests from "@/pages/reception/RescheduleRequests";
import CancellationRequests from "@/pages/reception/CancellationRequests";
import PatientSearch from "@/pages/reception/PatientSearch";
import BillingPayments from "@/pages/reception/BillingPayments";

// Admin
import AdminDashboard from "@/pages/admin/Dashboard";
import StaffManagement from "@/pages/admin/StaffManagement";
import ClinicSettings from "@/pages/admin/ClinicSettings";
import ReportsDashboard from "@/pages/admin/ReportsDashboard";
import LogsPage from "@/pages/admin/LogsPage";

// Shared
import CommunicationCenter from "@/pages/shared/CommunicationCenter";
import BroadcastCenter from "@/pages/shared/BroadcastCenter";
import ProfilePage from "@/pages/shared/ProfilePage";
import AccountSettingsPage from "@/pages/shared/AccountSettingsPage";

export default function App() {
  return (
    <AppStateProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<JoinStaff />} />

        <Route element={<RequireRole allow={["doctor"]} />}>
          <Route element={<DoctorShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/calendar" element={<CalendarView />} />
            <Route path="/dashboard/requests" element={<Requests />} />
            <Route path="/dashboard/confirmed" element={<Confirmed />} />
            <Route path="/dashboard/cancelled" element={<Cancelled />} />
            <Route path="/dashboard/patients" element={<PatientList />} />
            <Route path="/dashboard/notifications" element={<Notifications />} />
            <Route path="/dashboard/availability" element={<Availability />} />
            <Route path="/dashboard/broadcast" element={<BroadcastCenter />} />
            <Route path="/dashboard/communication" element={<CommunicationCenter />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/dashboard/settings" element={<AccountSettingsPage />} />

            <Route path="/patient/:id" element={<PatientWorkspace />} />
            <Route path="/patient/:id/voice-to-chart" element={<VoiceToChart />} />
            <Route path="/patient/:id/prescription" element={<Prescription />} />
            <Route path="/patient/:id/treatment-plan" element={<TreatmentPlan />} />
          </Route>
        </Route>

        <Route element={<RequireRole allow={["receptionist"]} />}>
          <Route element={<ReceptionistShell />}>
            <Route path="/reception" element={<ReceptionDashboard />} />
            <Route path="/reception/appointments" element={<AppointmentManagement />} />
            <Route path="/reception/checkin" element={<CheckInBoard />} />
            <Route path="/reception/requests" element={<ReceptionRequests />} />
            <Route path="/reception/reschedule" element={<RescheduleRequests />} />
            <Route path="/reception/cancellations" element={<CancellationRequests />} />
            <Route path="/reception/patients" element={<PatientSearch />} />
            <Route path="/reception/billing" element={<BillingPayments />} />
            <Route path="/reception/communication" element={<CommunicationCenter />} />
            <Route path="/reception/broadcast" element={<BroadcastCenter />} />
            <Route path="/reception/notifications" element={<Notifications />} />
            <Route path="/reception/profile" element={<ProfilePage />} />
            <Route path="/reception/settings" element={<AccountSettingsPage />} />
          </Route>
        </Route>

        <Route element={<RequireRole allow={["admin"]} />}>
          <Route element={<AdminShell />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/staff" element={<StaffManagement />} />
            <Route path="/admin/communication" element={<CommunicationCenter />} />
            <Route path="/admin/broadcast" element={<BroadcastCenter />} />
            <Route path="/admin/reports" element={<ReportsDashboard />} />
            <Route path="/admin/logs" element={<LogsPage />} />
            <Route path="/admin/settings" element={<ClinicSettings />} />
            <Route path="/admin/notifications" element={<Notifications />} />
            <Route path="/admin/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppStateProvider>
  );
}
