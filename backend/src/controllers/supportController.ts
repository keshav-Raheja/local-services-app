import { Request, Response } from "express";
import { faqData } from "../data/faq";

function findBestMatch(query: string): string {
  const q = query.toLowerCase().trim();
  let bestScore = 0;
  let bestAnswer =
    "I'm sorry, I couldn't find a specific answer to your question. Please try rephrasing, or contact our support team at support@servicehub.com for personalized help.";

  for (const entry of faqData) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (q.includes(keyword.toLowerCase())) {
        score += keyword.split(" ").length; // longer keyword match = higher score
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = entry.answer;
    }
  }

  return bestAnswer;
}

export const askSupport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ message: "Please provide a message" });
      return;
    }

    const answer = findBestMatch(message);

    // Add slight delay to feel more natural
    await new Promise((resolve) => setTimeout(resolve, 500));

    res.json({ answer });
  } catch (error) {
    res.status(500).json({ message: "Support service error. Please try again." });
  }
};

export const getFAQs = async (_req: Request, res: Response): Promise<void> => {
  const faqs = faqData.map(({ question, answer }) => ({ question, answer }));
  res.json(faqs);
};
