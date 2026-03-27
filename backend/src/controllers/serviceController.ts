import { Request, Response } from "express";
import Service from "../models/serviceModel";

// CREATE SERVICE
export const createService = async (req: Request, res: Response) => {
  try {
    const { name, price, description } = req.body;

    const service = await Service.create({
      name,
      price,
      description
    });

    res.status(201).json(service);

  } catch (error) {
    res.status(500).json({ message: "Error creating service" });
  }
};

// GET ALL SERVICES
export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await Service.find();
    res.json(services);

  } catch (error) {
    res.status(500).json({ message: "Error fetching services" });
  }
};