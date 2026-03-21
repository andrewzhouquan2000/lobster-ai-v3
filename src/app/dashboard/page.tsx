import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getProjectsByOwner } from '@/lib/db/projects';
import { getProjectStateByProjectId } from '@/lib/db/project-state';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect('/auth');
  }

  // Get user's projects from SQLite
  const projects = getProjectsByOwner(user.id);

  // 为每个项目获取状态信息
  const projectsWithState = projects.map(project => {
    const state = getProjectStateByProjectId(project.id);
    return {
      ...project,
      state: state ? {
        phase: state.phase,
        progress: state.progress,
        deploy_url: state.deploy_url,
      } : undefined,
    };
  });

  return <DashboardClient user={user} initialProjects={projectsWithState || []} />;
}