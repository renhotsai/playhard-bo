"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, CreditCard, Gamepad2, TrendingUp, Activity, Plus, ArrowUpRight } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "系統管理員",
      value: "12",
      change: "+2",
      changeType: "increase" as const,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "活躍客戶",
      value: "1,247",
      change: "+18%",
      changeType: "increase" as const,
      icon: UserCheck,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      iconColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "本月收入",
      value: "$24,890",
      change: "+12.5%",
      changeType: "increase" as const,
      icon: CreditCard,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    {
      title: "可用劇本",
      value: "156",
      change: "+5",
      changeType: "increase" as const,
      icon: Gamepad2,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
      iconColor: "text-purple-600 dark:text-purple-400"
    }
  ];

  return (
    <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                儀表板總覽
              </h2>
              <p className="text-muted-foreground mt-2">歡迎來到 PlayHard 管理後台</p>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              快速操作
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={stat.title} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {stat.value}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 border-green-200 dark:border-green-800">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {stat.change}
                        </Badge>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="md:col-span-2 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      Manage your backoffice efficiently
                    </CardDescription>
                  </div>
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { title: "User Management", desc: "View and manage system users", color: "bg-blue-500" },
                    { title: "Customer Registration", desc: "Handle customer registrations", color: "bg-green-500" },
                    { title: "Payment Processing", desc: "Process payment transactions", color: "bg-amber-500" },
                    { title: "Script Management", desc: "Manage game scripts and content", color: "bg-purple-500" }
                  ].map((action, index) => (
                    <Button 
                      key={action.title}
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-start text-left hover:shadow-md transition-all duration-200 hover:border-gray-300"
                    >
                      <div className="flex items-center w-full mb-2">
                        <div className={`w-2 h-2 rounded-full ${action.color} mr-3`} />
                        <span className="font-medium text-sm">{action.title}</span>
                      </div>
                      <span className="text-xs text-gray-500">{action.desc}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">System Status</CardTitle>
                    <CardDescription className="text-xs text-gray-500 mt-1">
                      Real-time system health
                    </CardDescription>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Database", status: "Connected", color: "text-green-600" },
                    { label: "Authentication", status: "Active", color: "text-green-600" },
                    { label: "API Status", status: "Operational", color: "text-green-600" },
                    { label: "Cache", status: "Running", color: "text-green-600" }
                  ].map((item, index) => (
                    <div key={item.label} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </span>
                      <Badge variant="secondary" className={`text-xs ${item.color} bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800`}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
    </div>
  );
}