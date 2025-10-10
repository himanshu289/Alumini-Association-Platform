import Job from '../models/jobModel.js';

// Get all jobs
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new job
export const addJob = async (req, res) => {
  const { title, company, location, description, requirements, postedBy, type } = req.body;
  try {
    const newJob = new Job({ title, company, location, description, requirements, postedBy, type });
    await newJob.save();
    res.status(201).json(newJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
