import { useCallback } from 'react';

interface ExportOptions {
  filename?: string;
  format: 'pdf' | 'json' | 'csv' | 'html';
}

/**
 * Export application checklist as PDF
 * Requires pdf-lib or similar library in production
 */
export function useExportChecklist() {
  return useCallback(
    async (
      opportunityTitle: string,
      checklist: Array<{ text: string; completed: boolean }>,
      options: Partial<ExportOptions> = {}
    ) => {
      const filename = options.filename || `${opportunityTitle}-checklist.json`;

      // Create JSON export (easy approach)
      if (options.format === 'json' || !options.format) {
        const data = {
          opportunity: opportunityTitle,
          exportDate: new Date().toISOString(),
          items: checklist,
          completed: checklist.filter(c => c.completed).length,
          total: checklist.length,
          progress: Math.round((checklist.filter(c => c.completed).length / checklist.length) * 100),
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        downloadBlob(blob, filename);
      }

      // Create CSV export
      if (options.format === 'csv') {
        let csv = 'Task,Status,Completed\n';
        checklist.forEach(item => {
          csv += `"${item.text.replace(/"/g, '""')}","${item.completed ? 'Done' : 'Pending'}","${item.completed ? 'Yes' : 'No'}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        downloadBlob(blob, filename.replace('.json', '.csv'));
      }

      // Create HTML export (for PDF printing)
      if (options.format === 'html' || options.format === 'pdf') {
        const html = generateChecklistHTML(opportunityTitle, checklist);
        const blob = new Blob([html], { type: 'text/html' });
        
        if (options.format === 'html') {
          downloadBlob(blob, filename.replace('.json', '.html'));
        } else if (options.format === 'pdf') {
          // Trigger browser print dialog for PDF
          const url = URL.createObjectURL(blob);
          const printWindow = window.open(url);
          if (printWindow) {
            printWindow.addEventListener('load', () => {
              printWindow.print();
            });
          }
        }
      }
    },
    []
  );
}

/**
 * Export user profile as PDF
 */
export function useExportProfile() {
  return useCallback(
    async (userProfile: any) => {
      const html = generateProfileHTML(userProfile);
      const blob = new Blob([html], { type: 'text/html' });
      
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    },
    []
  );
}

/**
 * Export AI-generated plan
 */
export function useExportAIPlan() {
  return useCallback(
    async (opportunityTitle: string, plan: string) => {
      const data = {
        opportunity: opportunityTitle,
        plan,
        exportDate: new Date().toISOString(),
        type: 'AI-Generated Application Strategy',
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      downloadBlob(blob, `${opportunityTitle}-ai-plan.json`);
    },
    []
  );
}

// Helper functions

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateChecklistHTML(title: string, checklist: Array<{ text: string; completed: boolean }>): string {
  const completed = checklist.filter(c => c.completed).length;
  const total = checklist.length;
  const progress = Math.round((completed / total) * 100);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title} - Application Checklist</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 28px; margin-bottom: 10px; }
        .meta { color: #666; margin-bottom: 20px; font-size: 14px; }
        .progress-bar { width: 100%; height: 8px; background: #eee; border-radius: 4px; margin-bottom: 20px; overflow: hidden; }
        .progress { background: #FF5C00; height: 100%; border-radius: 4px; transition: width 0.3s; }
        .progress-text { font-size: 12px; font-weight: 600; color: #FF5C00; margin-bottom: 20px; }
        ul { list-style: none; }
        li { padding: 12px; margin-bottom: 8px; border: 2px solid #eee; border-radius: 6px; display: flex; align-items: center; }
        li.completed { background: #f0fdf4; border-color: #a7f3d0; }
        .checkbox { width: 20px; height: 20px; border: 2px solid #ccc; border-radius: 4px; margin-right: 12px; display: flex; align-items: center; justify-content: center; }
        li.completed .checkbox { background: #14532d; border-color: #14532d; color: #fff; }
        .date { color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="meta">Application Checklist</p>
      
      <div class="progress-bar">
        <div class="progress" style="width: ${progress}%"></div>
      </div>
      <div class="progress-text">${completed}/${total} completed (${progress}%)</div>
      
      <ul>
        ${checklist.map(item => `
          <li ${item.completed ? 'class="completed"' : ''}>
            <div class="checkbox">${item.completed ? '✓' : ''}</div>
            <span>${item.text}</span>
          </li>
        `).join('')}
      </ul>
      
      <div class="date">Generated on ${new Date().toLocaleDateString()}</div>
    </body>
    </html>
  `;
}

function generateProfileHTML(profile: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${profile.full_name} - LaunchPad Profile</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .avatar { width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 15px; }
        h1 { font-size: 28px; margin-bottom: 10px; }
        .role { color: #666; font-size: 16px; margin-bottom: 20px; }
        section { margin-bottom: 30px; }
        h2 { font-size: 16px; font-weight: 600; margin-bottom: 10px; border-bottom: 2px solid #FF5C00; padding-bottom: 5px; }
        .stat { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .stat-label { color: #666; }
        .stat-value { font-weight: 600; color: #FF5C00; }
        .badge { display: inline-block; background: #FFF3EE; color: #FF5C00; padding: 6px 12px; border-radius: 20px; margin: 5px 5px 5px 0; font-size: 12px; font-weight: 600; }
        .date { color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        ${profile.avatar_url ? `<img src="${profile.avatar_url}" alt="${profile.full_name}" class="avatar">` : ''}
        <h1>${profile.full_name}</h1>
        <p class="role">${profile.bio || 'LaunchPad Member'}</p>
      </div>

      <section>
        <h2>Statistics</h2>
        <div class="stat">
          <span class="stat-label">Applications Started</span>
          <span class="stat-value">${profile.total_applications || 0}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Applications Submitted</span>
          <span class="stat-value">${profile.total_submitted || 0}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Connections</span>
          <span class="stat-value">${profile.total_connections || 0}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total XP</span>
          <span class="stat-value">${profile.total_xp || 0}</span>
        </div>
      </section>

      ${profile.badges_earned && profile.badges_earned.length > 0 ? `
        <section>
          <h2>Badges Earned</h2>
          <div>
            ${profile.badges_earned.map((badge: string) => `<span class="badge">${badge}</span>`).join('')}
          </div>
        </section>
      ` : ''}

      <div class="date">Generated on ${new Date().toLocaleDateString()} • LaunchPad Profile</div>
    </body>
    </html>
  `;
}
