import { useQuery } from '@tanstack/react-query';
import { UserCheck } from 'lucide-react';
import { apiGet } from '../../services/api';
import dayjs from 'dayjs';

export default function EmployeesPage() {
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiGet('/employees'),
  });

  const list = Array.isArray(employees) ? employees : (employees as any)?.data ?? [];

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Employees</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading...</div>
        ) : list.map((emp: any) => (
          <div key={emp.id} className="card">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {emp.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{emp.user?.name}</p>
                <p className="text-xs text-gray-400">{emp.position ?? emp.user?.role?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{emp.employeeCode}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>Hire: {dayjs(emp.hireDate).format('DD/MM/YYYY')}</span>
              <span>Rp {Number(emp.baseSalary).toLocaleString('id-ID')}/mo</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
