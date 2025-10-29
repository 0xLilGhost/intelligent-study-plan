import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { TodayDashboard } from '@/components/dashboard/TodayDashboard';
import { GoalForm } from '@/components/dashboard/GoalForm';
import { FileUpload } from '@/components/dashboard/FileUpload';
import { LogOut, Mountain } from 'lucide-react';
import mountainTrail from '@/assets/mountain-trail.jpg';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showGoalForm, setShowGoalForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    loadProfile();
    setShowGoalForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Mountain className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${mountainTrail})`,
          filter: 'brightness(0.3) blur(2px)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen bg-background/80 backdrop-blur-sm">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Today</h1>
              <h2 className="text-2xl font-bold text-muted-foreground">Dashboard</h2>
            </div>
            <div className="flex items-center gap-4">
              {profile && <StatsBar tokens={profile.tokens} streak={profile.streak} />}
              <Button variant="outline" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
          <FileUpload userId={user.id} onUploadSuccess={handleRefresh} />
          
          <TodayDashboard 
            key={refreshKey}
            userId={user.id} 
            onAddNewTrail={() => setShowGoalForm(true)}
          />
        </main>

        {/* Goal Form Dialog */}
        <Dialog open={showGoalForm} onOpenChange={setShowGoalForm}>
          <DialogContent className="max-w-lg">
            <GoalForm userId={user.id} onGoalCreated={handleRefresh} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;
