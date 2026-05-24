import { Request, Response } from "express";
import Service from "../models/serviceModel";

// GET ALL SERVICES
export const getServices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: "Error fetching services" });
  }
};

// CREATE SERVICE (admin only)
export const createService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, price, description } = req.body;
    if (!name) { res.status(400).json({ message: "Service name is required" }); return; }

    const existing = await Service.findOne({ name });
    if (existing) { res.status(400).json({ message: "Service already exists" }); return; }

    const service = await Service.create({ name, price, description });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: "Error creating service" });
  }
};

// DELETE SERVICE (admin only)
export const deleteService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Service.findByIdAndDelete(id);
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting service" });
  }
};