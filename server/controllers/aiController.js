import Resume from "../models/Resume.js";
import ai from "../configs/ai.js";

// controller for enhancing a resume's professional summary
// POST: /api/ai/enhance-pro-sum
export const enhanceProfessionalSummary = async (req, res) => {
    try {
        const { userContent } = req.body;

        if(!userContent){
            return res.status(400).json({message: 'Missing required fields'})
        }

       const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                { role: "system", content: "You are an expert in resume writing. Your task is to enhance the professional summary of a resume. The summary should be 1-2 sentences also highlighting key skills, experience, and career objectives. Make it compelling and ATS-friendly. and only return text no options or anything else." },
                {
                    role: "user",
                    content: userContent,
                },
    ],
        })

        const enhancedContent = response.choices[0].message.content;
        return res.status(200).json({enhancedContent})
    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}

// controller for enhancing a resume's job description
// POST: /api/ai/enhance-job-desc
export const enhanceJobDescription = async (req, res) => {
    try {
        const { userContent } = req.body;

        if(!userContent){
            return res.status(400).json({message: 'Missing required fields'})
        }

       const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                { role: "system",
                 content: "You are an expert in resume writing. Your task is to enhance the job description of a resume. The job description should be only in 1-2 sentence also highlighting key responsibilities and achievements. Use action verbs and quantifiable results where possible. Make it ATS-friendly. and only return text no options or anything else." },
                {
                    role: "user",
                    content: userContent,
                },
    ],
        })

        const enhancedContent = response.choices[0].message.content;
        return res.status(200).json({enhancedContent})
    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}

// controller for uploading a resume to the database
// POST: /api/ai/upload-resume
export const uploadResume = async (req, res) => {
    try {
       
        const {resumeText, title, jobDescription} = req.body;
        const userId = req.userId;

        if(!resumeText){
            return res.status(400).json({message: 'Missing required fields'})
        }

         const systemPrompt = `
            You are an expert AI Agent specialized in parsing resumes and optimizing them for ATS without adding any new or invented information.

            Strict Rules:
            - DO NOT add any new skills, tools, technologies, or data not present in the resume.
            - DO NOT fabricate experience, projects, dates, education, or personal details.
            - Extract ONLY relevant keywords from the job description.
            - Sprinkle those keywords naturally into the resume content (summary, experience descriptions, projects) ONLY where they logically fit.
            - Do NOT force keywords unnaturally.
            - Personal info, dates, company names, and positions must NOT be changed.
            `;

            const userPrompt = `
            extract data from this resume: ${resumeText}

            Also extract relevant keywords from this job description: ${jobDescription}

            Strict Instructions:
            - Use only keywords that actually appear in the job description.
            - Do NOT add new skills that are not already present in the resume.
            - Embed job-description keywords naturally to improve ATS relevance.
            - Do NOT modify or invent any data.
            - Output must strictly follow the JSON format below.
            - No text before or after the JSON.

            {
            professional_summary: { type: String, default: '' },
            skills: [{ type: String }],
            personal_info: {
                image: {type: String, default: '' },
                full_name: {type: String, default: '' },
                profession: {type: String, default: '' },
                email: {type: String, default: '' },
                phone: {type: String, default: '' },
                location: {type: String, default: '' },
                linkedin: {type: String, default: '' },
                website: {type: String, default: '' },
            },
            experience: [
                {
                    company: { type: String },
                    position: { type: String },
                    start_date: { type: String },
                    end_date: { type: String },
                    description: { type: String },
                    is_current: { type: Boolean },
                }
            ],
            project: [
                {
                    name: { type: String },
                    type: { type: String },
                    description: { type: String },
                }
            ],
            education: [
                {
                    institution: { type: String },
                    degree: { type: String },
                    field: { type: String },
                    graduation_date: { type: String },
                    gpa: { type: String },
                }
            ]
            }
            `;

       const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                { role: "system",
                 content: systemPrompt },
                {
                    role: "user",
                    content: userPrompt,
                },
        ],
        response_format: {type:  'json_object'}
        })

        const extractedData = response.choices[0].message.content;
        const parsedData = JSON.parse(extractedData)
        const newResume = await Resume.create({userId, title, ...parsedData})

        res.json({resumeId: newResume._id})
    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}