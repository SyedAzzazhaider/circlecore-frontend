import api from "./client";

export type PlanId = "standard" | "premium";

export type Plan = {
  id:          PlanId;
  name:        string;
  price:       number;
  interval:    "month" | "year";
  features:    string[];
  isPopular?:  boolean;
};

export type Subscription = {
  _id:            string;
  planId:         PlanId;
  status:         "active" | "cancelled" | "past_due" | "trialing";
  currentPeriodStart: string;
  currentPeriodEnd:   string;
  cancelAtPeriodEnd:  boolean;
  stripeCustomerId?:  string;
};

export type Invoice = {
  _id:        string;
  amount:     number;
  currency:   string;
  status:     "paid" | "open" | "void";
  createdAt:  string;
  invoiceUrl?: string;
  planName:   string;
};

type ApiResponse<T> = { data: T };

export var billingApi = {
  getSubscription: function() {
    return api.get<ApiResponse<Subscription | null>>("/billing/subscription");
  },

  getPlans: function() {
    return api.get<ApiResponse<Plan[]>>("/billing/plans");
  },

  subscribe: function(planId: PlanId) {
    return api.post<ApiResponse<{ checkoutUrl: string }>>("/billing/subscribe", { planId: planId });
  },

  cancelSubscription: function() {
    return api.post<ApiResponse<Subscription>>("/billing/cancel", {});
  },

  resumeSubscription: function() {
    return api.post<ApiResponse<Subscription>>("/billing/resume", {});
  },

  getInvoices: function() {
    return api.get<ApiResponse<Invoice[]>>("/billing/invoices");
  },

  getPortalUrl: function() {
    return api.post<ApiResponse<{ portalUrl: string }>>("/billing/portal", {});
  }
};

export var PLANS: Plan[] = [
  {
    id:       "standard",
    name:     "Standard",
    price:    0,
    interval: "month",
    features: [
      "Join up to 3 communities",
      "Post and comment",
      "RSVP to public events",
      "Basic profile"
    ]
  },
  {
    id:        "premium",
    name:      "Premium",
    price:     12,
    interval:  "month",
    isPopular: true,
    features: [
      "Unlimited communities",
      "Priority feed ranking",
      "Create private events",
      "Full profile with social links",
      "Advanced analytics",
      "Badge and reputation boosts"
    ]
  }
];