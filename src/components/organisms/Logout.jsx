import { useAuth } from '@/layouts/Root';
import Button from '@/components/atoms/Button';
import ApperIcon from '@/components/ApperIcon';

const Logout = () => {
  const { logout } = useAuth();

  return (
    <Button
      variant="ghost"
      onClick={logout}
      className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
    >
      <ApperIcon name="LogOut" size={16} />
      Logout
    </Button>
  );
};

export default Logout;