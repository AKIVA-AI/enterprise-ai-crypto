import { MainLayout } from '@/components/layout/MainLayout';
import { wallets } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, Plus, Send, ArrowDownLeft, Shield, Key, Copy, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const networkColors: Record<string, string> = {
  Ethereum: 'bg-chart-4/20 text-chart-4',
  Bitcoin: 'bg-chart-3/20 text-chart-3',
  Solana: 'bg-chart-2/20 text-chart-2',
};

const typeIcons = {
  hot: '🔥',
  cold: '❄️',
  multisig: '🔐',
};

export default function Treasury() {
  const totalUsdValue = wallets.reduce((sum, w) => {
    // Simple mock conversion
    const usdValue = w.currency === 'USDC' ? w.balance :
                     w.currency === 'BTC' ? w.balance * 68000 :
                     w.currency === 'SOL' ? w.balance * 145 : 0;
    return sum + usdValue;
  }, 0);

  const pendingApprovals = wallets.reduce((sum, w) => sum + w.pendingApprovals, 0);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-7 w-7 text-primary" />
              Treasury & Wallets
            </h1>
            <p className="text-muted-foreground">Watch-only wallets, balances, and transfer approvals</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Wallet
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="metric-card md:col-span-2">
            <p className="text-sm text-muted-foreground">Total Treasury Value</p>
            <p className="text-3xl font-mono font-bold">${totalUsdValue.toLocaleString()}</p>
          </div>
          <div className="metric-card">
            <p className="text-sm text-muted-foreground">Watched Wallets</p>
            <p className="text-2xl font-mono font-semibold">{wallets.length}</p>
          </div>
          <div className="metric-card">
            <p className="text-sm text-muted-foreground">Pending Approvals</p>
            <p className={cn(
              'text-2xl font-mono font-semibold',
              pendingApprovals > 0 ? 'text-warning' : ''
            )}>
              {pendingApprovals}
            </p>
          </div>
        </div>

        {/* Wallet cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {wallets.map((wallet) => (
            <div key={wallet.id} className="glass-panel rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{typeIcons[wallet.type]}</span>
                    <h3 className="font-semibold">{wallet.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', networkColors[wallet.network])}>
                      {wallet.network}
                    </span>
                    <Badge variant={wallet.type === 'cold' ? 'secondary' : wallet.type === 'multisig' ? 'outline' : 'warning'}>
                      {wallet.type}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-mono font-bold">
                    {wallet.balance.toLocaleString()} {wallet.currency}
                  </p>
                  {wallet.pendingApprovals > 0 && (
                    <Badge variant="warning" className="mt-1">
                      {wallet.pendingApprovals} pending
                    </Badge>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 mb-4">
                <code className="text-xs font-mono text-muted-foreground flex-1 truncate">
                  {wallet.address}
                </code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyAddress(wallet.address)}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>

              {/* Multi-sig info */}
              {wallet.type === 'multisig' && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 mb-4">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Multi-Signature</p>
                    <p className="text-xs text-muted-foreground">
                      {wallet.requiredSigners} of {wallet.signers} signers required
                    </p>
                  </div>
                  <div className="flex-1" />
                  <div className="flex -space-x-2">
                    {Array.from({ length: wallet.signers }).map((_, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center"
                      >
                        <span className="text-xs font-medium text-primary">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <ArrowDownLeft className="h-4 w-4" />
                  Receive
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <Send className="h-4 w-4" />
                  Send
                </Button>
                {wallet.type === 'multisig' && wallet.pendingApprovals > 0 && (
                  <Button size="sm" className="flex-1 gap-1">
                    <Shield className="h-4 w-4" />
                    Approve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
