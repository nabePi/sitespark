import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Zap,
  Crown,
  Building2,
  Check,
} from 'lucide-react'
import { useTokenStore } from '@/stores/token.store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'

const tokenPackages = [
  {
    id: 'starter',
    name: 'Starter',
    tokens: 100,
    price: 50000,
    popular: false,
    icon: Zap,
    features: ['100 AI credits', 'Basic support', '1 website'],
  },
  {
    id: 'pro',
    name: 'Pro',
    tokens: 500,
    price: 200000,
    bonus: 50,
    popular: true,
    icon: Crown,
    features: ['550 AI credits', 'Priority support', '10 websites', 'Custom domain'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tokens: 2000,
    price: 750000,
    bonus: 300,
    popular: false,
    icon: Building2,
    features: ['2300 AI credits', '24/7 support', 'Unlimited websites', 'Custom domain', 'API access'],
  },
]

export function TokenWalletPage() {
  const { balance, transactions, fetchBalance, fetchTransactions, purchaseTokens } = useTokenStore()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)

  useEffect(() => {
    fetchBalance()
    fetchTransactions()
  }, [fetchBalance, fetchTransactions])

  const handlePurchase = async (packageId: string) => {
    setIsPurchasing(true)
    try {
      await purchaseTokens(packageId, 'midtrans')
      setSelectedPackage(null)
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Token Wallet</h1>
        <p className="text-slate-600">Manage your AI tokens and purchase more</p>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass-card border-0 overflow-hidden relative">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cta/20 rounded-full blur-3xl" />
          
          <CardContent className="relative z-10 p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-slate-500 mb-1">Current Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold gradient-text">
                    {balance.toLocaleString()}
                  </span>
                  <span className="text-slate-400">tokens</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-500">Estimated value</p>
                  <p className="text-lg font-semibold text-slate-900">
                    Rp {(balance * 500).toLocaleString()}
                  </p>
                </div>
                
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-cta flex items-center justify-center">
                  <Coins className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="purchase" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="purchase">Purchase Tokens</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase" className="mt-6">
          <div className="grid md:grid-cols-3 gap-6">
            {tokenPackages.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`
                  glass-card h-full relative overflow-hidden
                  ${pkg.popular ? 'ring-2 ring-cta' : ''}
                `}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 right-0 bg-cta text-white text-xs font-semibold px-3 py-1 rounded-bl-xl">
                      Popular
                    </div>
                  )}

                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <pkg.icon className="w-6 h-6 text-primary" />
                    </div>
                    
                    <CardTitle>{pkg.name}</CardTitle>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold text-slate-900">
                        Rp {pkg.price.toLocaleString()}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-primary">
                        {pkg.tokens.toLocaleString()}
                      </span>
                      <span className="text-slate-500"> tokens</span>
                      
                      {pkg.bonus && (
                        <span className="ml-2 text-sm text-cta font-medium">
                          +{pkg.bonus} bonus
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6">
                      {pkg.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                          <Check className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={isPurchasing}
                      className={pkg.popular ? 'bg-cta hover:bg-cta/90 w-full' : 'w-full'}
                    >
                      {isPurchasing && selectedPackage === pkg.id ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Purchase
                        </span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center
                          ${tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}
                        `}>
                          {tx.type === 'credit' ? (
                            <ArrowDownLeft className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        
                        <div>
                          <p className="font-medium text-slate-900">{tx.description}</p>
                          <p className="text-sm text-slate-500">
                            {format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`
                          font-semibold
                          ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}
                        `}>
                          {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                        </p>
                        <p className="text-sm text-slate-400">
                          Balance: {tx.balance}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
