import React from 'react';
import { AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import {
  DashboardLayout,
  DashboardHeader,
  MetricGrid,
  StatCard,
  Panel,
  Alert,
} from '../../components/ui/cards';
import { Button, Badge } from '../../components/ui/modern';

export function DepartmentDashboard() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <DashboardHeader
          title="Department Portal"
          subtitle="You have 3 MAPs requiring immediate attention"
        />
        <div className="flex items-center gap-4 glass rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-muted-foreground">IT Department</span>
          </div>
          <div className="w-px h-6 bg-cyber-cyan/20" />
          <Badge variant="primary" className="text-xs">
            Security Admin
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <MetricGrid cols={4}>
        <StatCard
          label="Active MAPs"
          value="5"
          icon={<CheckCircle2 size={24} />}
          accentColor="blue"
          trend={{ value: 20, isPositive: true }}
        />
        <StatCard
          label="Overdue"
          value="1"
          icon={<AlertCircle size={24} />}
          accentColor="red"
          trend={{ value: 2, isPositive: false }}
        />
        <StatCard
          label="Pending Validation"
          value="2"
          icon={<Clock size={24} />}
          accentColor="magenta"
          trend={{ value: 1, isPositive: false }}
        />
        <StatCard
          label="Completed This Month"
          value="12"
          icon={<Zap size={24} />}
          accentColor="cyan"
          trend={{ value: 50, isPositive: true }}
        />
      </MetricGrid>

      {/* Urgent Items */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={20} className="text-red-400" />
          <h2 className="text-xl font-semibold text-foreground">Urgent Items</h2>
        </div>

        <Alert
          type="error"
          title="MAP-2026-013: Update Firewall Config"
          message="Overdue by 2 days • Priority: Critical"
          action={
            <div className="flex gap-2">
              <Button variant="primary" size="sm">
                View MAP
              </Button>
              <Button variant="secondary" size="sm">
                Upload Evidence
              </Button>
              <Button variant="ghost" size="sm">
                Request Extension
              </Button>
            </div>
          }
        />

        <Alert
          type="warning"
          title="MAP-2026-009: Security Patch Review"
          message="Due in 3 days • Priority: High"
          action={
            <div className="flex gap-2">
              <Button variant="primary" size="sm">
                View MAP
              </Button>
              <Button variant="secondary" size="sm">
                Upload Evidence
              </Button>
            </div>
          }
        />
      </div>

      {/* Recent Activity */}
      <Panel title="Recent Activity" subtitle="Last 10 actions on your MAPs">
        <div className="space-y-3">
          {[
            { action: 'Approved', map: 'MAP-2026-007', time: '2 hours ago', user: 'Compliance Officer' },
            { action: 'Rejected', map: 'MAP-2026-006', time: '5 hours ago', user: 'Reviewer' },
            { action: 'Submitted', map: 'MAP-2026-005', time: '1 day ago', user: 'You' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 glass-dark rounded-lg border border-cyber-cyan/10">
              <div className="flex items-center gap-3 flex-1">
                <Badge
                  variant={
                    item.action === 'Approved'
                      ? 'success'
                      : item.action === 'Rejected'
                        ? 'error'
                        : 'info'
                  }
                >
                  {item.action}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.map}</p>
                  <p className="text-xs text-muted-foreground">{item.user}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
          ))}
        </div>
      </Panel>
    </DashboardLayout>
  );
}