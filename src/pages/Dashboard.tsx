import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockProfileApi, Profile } from '@/services/mockApi';
import { Button } from '@/components/ui/button';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { GoalForm } from '@/components/dashboard/GoalForm';
import { GoalsList } from '@/components/dashboard/GoalsList';
import { FileUpload } from '@/components/dashboard/FileUpload';
import { StudyPlan } from '@/components/dashboard/StudyPlan';
import { LogOut, Mountain } from 'lucide-react';
import mountainTrail from '@/assets/mountain-trail.jpg';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

    // TODO: Replace with actual API call
    const data = await mockProfileApi.getProfile(user.id);
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
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* File Upload */}
              <FileUpload userId={user.id} onUploadSuccess={handleRefresh} />
              
              {/* Goal Creation Form */}
              <GoalForm userId={user.id} onGoalCreated={handleRefresh} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Goals List */}
              <div key={`goals-${refreshKey}`}>
                <GoalsList userId={user.id} onPlanGenerated={handleRefresh} />
              </div>
              
              {/* Study Plan */}
              <div key={`plan-${refreshKey}`}>
                <StudyPlan userId={user.id} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
