import { Request, Response } from 'express';
import WasteRequest from '../models/WasteRequest';
import User from '../models/User';
import { createNotification } from '../services/notificationService';

export const createRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const newRequest = new WasteRequest(req.body);
    const savedRequest = await newRequest.save();

    // Notify the Citizen who created the request
    if (savedRequest.citizenId) {
      await createNotification(
        savedRequest.citizenId,
        'Pickup Scheduled',
        `You successfully added a new pickup request for ${savedRequest.wasteCategory}.`,
        'success'
      );
    }

    // Notify all Volunteers that a new pickup is available
    const volunteers = await User.find({ role: { $in: ['volunteer', 'Volunteer', 'VOLUNTEER'] } });
    
    // Fire notifications asynchronously so we don't block the API response
    Promise.all(volunteers.map(v => 
      createNotification(
        v.id,
        'New Pickup Requested',
        `A new ${savedRequest.wasteCategory} pickup is available!`,
        'info'
      )
    )).catch(err => console.error('Failed to send volunteer notifications:', err));

    res.status(201).json(savedRequest);
  } catch (err: any) {
    console.error('Error creating waste request:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getAllRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const requests = await WasteRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err: any) {
    console.error('Error fetching all requests:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getRequestsByCitizen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { citizenId } = req.params;
    const requests = await WasteRequest.find({ citizenId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err: any) {
    console.error('Error fetching citizen requests:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getRequestsByVolunteer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { volunteerId } = req.params;
    const requests = await WasteRequest.find({ volunteerId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err: any) {
    console.error('Error fetching volunteer requests:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getAvailableRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const requests = await WasteRequest.find({ status: 'Pending' }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err: any) {
    console.error('Error fetching available requests:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateRequestStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // updateData can contain status, weight, volunteerId, volunteerName, scheduledDate
    const updatedRequest = await WasteRequest.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );
    
    if (!updatedRequest) {
      res.status(404).json({ message: 'Waste request not found' });
      return;
    }
    
    res.json(updatedRequest);
  } catch (err: any) {
    console.error('Error updating request status:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
