import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getProjectsByOwner } from '@/lib/db/projects';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect('/auth');
  }

  // Get user's projects from SQLite
  const projects = getProjectsByOwner(user.id);

  return <DashboardClient user={user} initialProjects={projects || []} />;
}