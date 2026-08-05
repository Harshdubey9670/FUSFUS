const { Subscription, Tip, Badge, AffiliateLink, Payout, TaxInfo } = require('../models/Monetization');
const User = require('../models/User');

// @desc    Get Creator Earnings & Financial Summary
// @route   GET /api/monetization/earnings
// @access  Private
exports.getEarningsOverview = async (req, res, next) => {
  try {
    const creatorId = req.user.id;

    // Fetch real or aggregated data
    const subscriptions = await Subscription.find({ creator: creatorId, status: 'active' });
    const tips = await Tip.find({ creator: creatorId });
    const badges = await Badge.find({ creator: creatorId });
    const affiliateLinks = await AffiliateLink.find({ creator: creatorId });
    const payouts = await Payout.find({ creator: creatorId });

    // Calculate revenue totals
    const subscriptionRevenue = subscriptions.reduce((acc, s) => acc + s.price, 0);
    const tipsRevenue = tips.reduce((acc, t) => acc + t.amount, 0);
    const badgesRevenue = badges.reduce((acc, b) => acc + b.price, 0);
    const affiliateRevenue = affiliateLinks.reduce((acc, a) => acc + a.earnings, 0);
    const estimatedAdRevenue = 145.50; // Ad revenue calculation placeholder
    const sponsoredPostsRevenue = 350.00; // Sponsored content placeholder

    const totalGrossEarnings = subscriptionRevenue + tipsRevenue + badgesRevenue + affiliateRevenue + estimatedAdRevenue + sponsoredPostsRevenue;
    const paidOut = payouts.filter(p => p.status === 'completed').reduce((acc, p) => acc + p.amount, 0);
    const pendingBalance = totalGrossEarnings - paidOut;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalGrossEarnings: Number(totalGrossEarnings.toFixed(2)),
          pendingBalance: Number(pendingBalance.toFixed(2)),
          paidOut: Number(paidOut.toFixed(2)),
          subscribersCount: subscriptions.length,
          revenueBreakdown: {
            subscriptions: Number(subscriptionRevenue.toFixed(2)),
            tips: Number(tipsRevenue.toFixed(2)),
            badges: Number(badgesRevenue.toFixed(2)),
            affiliates: Number(affiliateRevenue.toFixed(2)),
            ads: estimatedAdRevenue,
            sponsorships: sponsoredPostsRevenue
          }
        },
        monthlyTrends: [
          { month: 'Jan', revenue: 420.00 },
          { month: 'Feb', revenue: 580.50 },
          { month: 'Mar', revenue: 790.00 },
          { month: 'Apr', revenue: 950.25 },
          { month: 'May', revenue: 1240.00 },
          { month: 'Jun', revenue: Number(totalGrossEarnings.toFixed(2)) }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Subscribe to a Creator
// @route   POST /api/monetization/subscribe
// @access  Private
exports.subscribeToCreator = async (req, res, next) => {
  try {
    const subscriberId = req.user.id;
    const { creatorId, tier = 'tier1', price = 4.99 } = req.body;

    if (subscriberId === creatorId) {
      return res.status(400).json({ success: false, message: 'You cannot subscribe to yourself' });
    }

    const renewsAt = new Date();
    renewsAt.setDate(renewsAt.getDate() + 30);

    const subscription = await Subscription.create({
      subscriber: subscriberId,
      creator: creatorId,
      tier,
      price,
      renewsAt
    });

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Successfully subscribed to creator'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send Tip to a Creator
// @route   POST /api/monetization/tip
// @access  Private
exports.sendTip = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { creatorId, amount, message } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid tip amount' });
    }

    const tip = await Tip.create({
      sender: senderId,
      creator: creatorId,
      amount,
      message: message || ''
    });

    res.status(201).json({
      success: true,
      data: tip,
      message: `Sent $${amount} tip successfully!`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Purchase Supporter Badge
// @route   POST /api/monetization/badge
// @access  Private
exports.purchaseBadge = async (req, res, next) => {
  try {
    const buyerId = req.user.id;
    const { creatorId, badgeType = 'supporter', price = 1.99 } = req.body;

    const badge = await Badge.create({
      buyer: buyerId,
      creator: creatorId,
      badgeType,
      price
    });

    res.status(201).json({
      success: true,
      data: badge,
      message: 'Supporter badge unlocked!'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage Affiliate Links
// @route   GET & POST /api/monetization/affiliates
// @access  Private
exports.getAffiliateLinks = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const links = await AffiliateLink.find({ creator: creatorId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: links
    });
  } catch (error) {
    next(error);
  }
};

exports.addAffiliateLink = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const { title, url } = req.body;

    if (!title || !url) {
      return res.status(400).json({ success: false, message: 'Title and URL are required' });
    }

    const link = await AffiliateLink.create({
      creator: creatorId,
      title,
      url
    });

    res.status(201).json({
      success: true,
      data: link,
      message: 'Affiliate link created'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Payout History & Request Withdrawal
// @route   GET & POST /api/monetization/payouts
// @access  Private
exports.getPayoutHistory = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const payouts = await Payout.find({ creator: creatorId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payouts
    });
  } catch (error) {
    next(error);
  }
};

exports.requestPayout = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const { amount, paymentMethod = 'bank_transfer' } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is $10.00' });
    }

    const payout = await Payout.create({
      creator: creatorId,
      amount,
      paymentMethod,
      status: 'processing'
    });

    res.status(201).json({
      success: true,
      data: payout,
      message: `Payout request for $${amount} submitted!`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get & Update Tax Info Placeholder
// @route   GET & POST /api/monetization/tax-info
// @access  Private
exports.getTaxInfo = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    let tax = await TaxInfo.findOne({ creator: creatorId });

    if (!tax) {
      tax = {
        legalName: '',
        taxIdType: 'SSN',
        taxIdMasked: '',
        country: 'United States',
        status: 'unverified'
      };
    }

    res.status(200).json({
      success: true,
      data: tax
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTaxInfo = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const { legalName, taxIdType = 'SSN', taxId, country = 'United States' } = req.body;

    if (!legalName || !taxId) {
      return res.status(400).json({ success: false, message: 'Legal Name and Tax ID are required' });
    }

    // Mask SSN/Tax ID for security
    const masked = taxId.length > 4 ? `***-**-${taxId.slice(-4)}` : '***';

    const tax = await TaxInfo.findOneAndUpdate(
      { creator: creatorId },
      {
        legalName,
        taxIdType,
        taxIdMasked: masked,
        country,
        status: 'verified'
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: tax,
      message: 'Tax document information saved successfully'
    });
  } catch (error) {
    next(error);
  }
};
