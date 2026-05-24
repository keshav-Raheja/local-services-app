export interface FaqEntry {
  keywords: string[];
  question: string;
  answer: string;
}

export const faqData: FaqEntry[] = [
  {
    keywords: ["book", "booking", "how to book", "book service", "appointment"],
    question: "How do I book a service?",
    answer:
      "To book a service: 1) Browse the Services page and find the service you need. 2) Click 'View Providers' to see available professionals. 3) Select a provider and click 'Book Now'. 4) Choose your preferred date and confirm. You'll see the booking status in 'My Bookings'.",
  },
  {
    keywords: ["provider", "become provider", "register provider", "join provider", "offer service"],
    question: "How do I become a service provider?",
    answer:
      "To become a provider: 1) Sign up and select 'Provider' as your role. 2) Go to the Services page and click '+ Add Provider'. 3) Fill in your details including name, phone, experience, and service. 4) Your location will be detected automatically. Once submitted, customers can find and book you!",
  },
  {
    keywords: ["cancel", "cancellation", "cancel booking", "refund"],
    question: "How do I cancel a booking?",
    answer:
      "You can cancel a booking that is in 'Pending' status from your 'My Bookings' page. Look for the Cancel button next to your pending bookings. Once a booking is confirmed or completed, it cannot be cancelled. For issues, contact support.",
  },
  {
    keywords: ["review", "rating", "feedback", "rate", "how to review"],
    question: "How do I leave a review?",
    answer:
      "You can leave a review after your booking is marked as 'Completed' by the provider. Go to 'My Bookings', find the completed booking, and click 'Leave Review'. You can rate from 1-5 stars and write feedback. You can only review each booking once.",
  },
  {
    keywords: ["login", "sign in", "cant login", "forgot password", "password"],
    question: "I can't log in to my account",
    answer:
      "If you're having trouble logging in: 1) Make sure you're using the correct email and password. 2) Check that you've selected the correct role (User or Provider). 3) Passwords are case-sensitive. 4) If you've forgotten your password, please contact support to reset it.",
  },
  {
    keywords: ["status", "booking status", "pending", "confirmed", "completed"],
    question: "What do the booking statuses mean?",
    answer:
      "Booking statuses: 🟡 Pending — Your request is awaiting provider response. 🔵 Confirmed — The provider accepted your booking. 🟢 Completed — Service has been delivered. 🔴 Rejected — The provider declined the request. You can only cancel Pending bookings.",
  },
  {
    keywords: ["payment", "pay", "price", "cost", "fee", "charge"],
    question: "How does payment work?",
    answer:
      "Payment is handled directly between you and the service provider. Discuss payment terms with your provider before or during the service. Our platform helps you connect with trusted professionals — future versions will include in-app payments.",
  },
  {
    keywords: ["account", "profile", "update profile", "change email", "delete account"],
    question: "How do I manage my account?",
    answer:
      "You can view your profile and account details after logging in. To update your information or request account deletion, please contact our support team.",
  },
  {
    keywords: ["provider not showing", "no providers", "no results", "empty"],
    question: "Why are there no providers showing?",
    answer:
      "If you see no providers: 1) The service may not have registered providers in your area yet. 2) Enable your location in browser settings for accurate nearby results. 3) Try a different service category. Providers are added regularly — check back soon!",
  },
  {
    keywords: ["contact", "help", "support", "human", "agent", "talk to someone"],
    question: "How do I contact support?",
    answer:
      "You can reach our support team via email at support@servicehub.com or through this chat. We typically respond within 24 hours. For urgent issues, please describe your problem in detail so we can help you faster.",
  },
];
