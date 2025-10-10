import { useEffect, useState } from 'react';
import { Heart, Trophy, Users, School, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Donate() {
  const [animatedStats, setAnimatedStats] = useState({ donors: 800, raised: 1500000, scholarships: 400 });

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedStats(prev => ({
        donors: Math.min(prev.donors + 10, 1000),
        raised: Math.min(prev.raised + 25000, 2000000),
        scholarships: Math.min(prev.scholarships + 5, 500)
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const donationAmounts = [25, 50, 100, 250, 500, 1000];
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(100);
  const [customAmount, setCustomAmount] = useState('');

  const causes = [
    {
      icon: <School className="h-6 w-6" />, 
      title: 'Infrastructure Development', 
      description: 'Support the expansion and modernization of campus facilities.', 
      goal: 500000, 
      raised: 350000
    },
    {
      icon: <Trophy className="h-6 w-6" />, 
      title: 'Scholarship Fund', 
      description: 'Help deserving students achieve their academic dreams.', 
      goal: 200000, 
      raised: 150000
    }
  ];

  const handleCustomAmountChange = (e: { target: { value: any; }; }) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCustomAmount(value);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center">
        <Heart className="h-12 w-12 text-indigo-600 mx-auto" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Support Your Alma Mater</h1>
        <p className="mt-2 text-lg text-gray-600">
          Your contribution helps shape the future of education and empowers the next generation.
        </p>
      </div>

      {/* Impact Statistics */}
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[ 
          { icon: <Users />, stat: animatedStats.donors, label: 'Alumni Donors' },
          { icon: <Trophy />, stat: `$${(animatedStats.raised / 1000000).toFixed(1)}M+`, label: 'Raised This Year' },
          { icon: <School />, stat: animatedStats.scholarships, label: 'Scholarships Awarded' }
        ].map((item, index) => (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6 text-center"
          >
            <div className="text-indigo-600 mx-auto w-fit">{item.icon}</div>
            <motion.div 
              className="mt-4 text-2xl font-bold text-gray-900"
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {item.stat}
            </motion.div>
            <div className="text-sm text-gray-500">{item.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Current Initiatives */}
      <div className="mt-12">
  <h2 className="text-2xl font-bold text-gray-900">Current Initiatives</h2>
  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
    {causes.map((cause, index) => {
      const progress = (cause.raised / cause.goal) * 100; // Calculate percentage
      return (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-indigo-600 mx-auto w-fit">{cause.icon}</div>
          <h3 className="mt-4 text-xl font-bold text-gray-900">{cause.title}</h3>
          <p className="mt-2 text-sm text-gray-600">{cause.description}</p>

          {/* Progress Bar */}
          <div className="mt-4 text-sm font-medium text-gray-700">
            Raised: <span className="text-indigo-600">${cause.raised.toLocaleString()}</span> / ${cause.goal.toLocaleString()}
          </div>
          <div className="mt-2 w-full bg-gray-300 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500" 
              style={{ width: `${progress}%` }} 
            ></div>
          </div>
        </div>
      );
    })}
  </div>
</div>


      {/* Donation Form */}
      <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900">Make a Donation</h2>
        <div className="mt-6">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {donationAmounts.map(amount => (
              <button
                key={amount}
                className={`px-4 py-2 rounded-md text-sm font-medium border ${
                  selectedAmount === amount
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-300'
                }`}
                onClick={() => setSelectedAmount(amount)}
                aria-label={`Donate $${amount}`}
              >
                ${amount}
              </button>
            ))}
          </div>
          
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="radio"
                className="form-radio text-indigo-600"
                checked={selectedAmount === 'custom'}
                onChange={() => setSelectedAmount('custom')}
                aria-label="Custom Amount"
              />
              <span className="ml-2 text-gray-700">Custom Amount</span>
            </label>
            {selectedAmount === 'custom' && (
              <input
                type="number"
                className="mt-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter amount"
                value={customAmount}
                onChange={handleCustomAmountChange}
                min="1"
                aria-label="Enter custom donation amount"
              />
            )}
          </div>

          <button className="mt-6 w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            Continue to Payment
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
