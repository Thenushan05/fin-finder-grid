import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/authSlice";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Shield, User, LogOut, Settings, Bell, CreditCard } from "lucide-react";

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="relative h-48 rounded-3xl overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-0 left-0 w-full p-8 flex items-end space-x-6">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
            <AvatarImage src="" alt={user?.email || "User"} />
            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-violet-600 text-3xl font-bold">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="mb-2 text-white">
            <h1 className="text-3xl font-bold">{user?.email?.split("@")[0] || "User Profile"}</h1>
            <p className="text-white/80">{user?.email || "user@example.com"}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User Details Card */}
        <Card className="col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Manage your personal details and account settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 mr-4">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{user?.email || "Not available"}</p>
                </div>
              </div>

              <div className="flex items-center p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mr-4">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Status</p>
                  <p className="font-medium">
                    {user?.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>

              <div className="flex items-center p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-medium">{user?.id || "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and account management.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start h-12 text-base font-normal hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 border-border/50">
              <Settings className="w-5 h-5 mr-3 text-muted-foreground" />
              Account Settings
            </Button>
            <Button variant="outline" className="w-full justify-start h-12 text-base font-normal hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 border-border/50">
              <Bell className="w-5 h-5 mr-3 text-muted-foreground" />
              Notifications
            </Button>
            <Button variant="outline" className="w-full justify-start h-12 text-base font-normal hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 border-border/50">
              <CreditCard className="w-5 h-5 mr-3 text-muted-foreground" />
              Billing & Subscription
            </Button>
            
            <div className="pt-4 mt-4 border-t border-border/50">
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full h-12 text-base shadow-md hover:shadow-lg transition-all"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
