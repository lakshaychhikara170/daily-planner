const fs = require('fs');

const originalPath = 'src/pages/RoutinesOriginal.jsx';
const targetPath = 'src/pages/Routines.jsx';

const originalContent = fs.readFileSync(originalPath, 'utf8');
let targetContent = fs.readFileSync(targetPath, 'utf8');

// 1. Extract Analytics Dashboard from Original
const dashboardStart = originalContent.indexOf('{/* Analytics Dashboard */}');
const isReorderingIndexOriginal = originalContent.indexOf('{isReordering ? (', dashboardStart);
// Backtrack to the line before {isReordering
const dashboardEnd = originalContent.lastIndexOf('</div>', isReorderingIndexOriginal) + 6;

const originalDashboard = originalContent.substring(dashboardStart, dashboardEnd);

// 2. Replace Analytics Dashboard in Target
const targetDashboardStart = targetContent.indexOf('{/* Analytics Dashboard */}');
const isReorderingIndexTarget = targetContent.indexOf('{isReordering ? (', targetDashboardStart);
const targetDashboardEnd = targetContent.lastIndexOf('</div>', isReorderingIndexTarget) + 6;

targetContent = targetContent.substring(0, targetDashboardStart) + originalDashboard + '\n\n        ' + targetContent.substring(isReorderingIndexTarget);

// 3. Revert Layout Wrappers
const splitWrapper = ) : (
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Left Pane (70%) */}
            <div style={{ flex: '7 1 600px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2rem' }}>;

const originalWrapper = ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>;

targetContent = targetContent.replace(splitWrapper, originalWrapper);

// 4. Remove Right Pane
const rightPaneStart = targetContent.indexOf('{/* Right Pane (30%) - Metrics List */}');
if (rightPaneStart !== -1) {
    const isArchivedIndex = targetContent.indexOf('<div style={{ marginTop: \\'8rem\\',', rightPaneStart);
    
    // We need to find the closing )} before the archived button.
    const closingParenIndex = targetContent.lastIndexOf(')}', isArchivedIndex);
    
    // Actually, the Right pane ends just before the last )} of the isReordering block.
    // Let's just remove from { /* Right Pane */ to the line before )}
    const beforeRightPane = targetContent.substring(0, rightPaneStart);
    const afterRightPane = targetContent.substring(closingParenIndex);
    
    // We also need to remove the extra closing </div></div> that was added for the left pane.
    // Let's carefully backtrack from rightPaneStart to remove the two </div> lines.
    const cleanBeforeRightPane = beforeRightPane.replace(/<\/div>\s*<\/div>\s*$/, '');
    
    targetContent = cleanBeforeRightPane + '\\n        ' + afterRightPane;
}

fs.writeFileSync(targetPath, targetContent, 'utf8');
console.log('Revert completed.');
