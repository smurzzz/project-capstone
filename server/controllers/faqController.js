import FAQ from "../models/FAQ.js";
import { cleanString, isValidObjectId } from "../utils/validation.js";
import { sendErrorResponse, handleControllerError } from "../utils/errorResponse.js";

const mapFAQInput = (body) => {
  const rawCategory = body.category;
  const normalizedCategory = rawCategory === 'Returns' ? 'Support' : rawCategory;

  return {
    question: cleanString(body.question, 500),
    answer: cleanString(body.answer, 2000),
    category: normalizedCategory || 'General',
    order: parseInt(body.order) || 0,
    active: body.active !== false,
  };
};

export const getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    handleControllerError(res, error, "FAQ.getAllFAQs", 500, "Failed to fetch FAQs");
  }
};

export const getFAQById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return sendErrorResponse(res, 400, "Invalid FAQ ID");
    }

    const faq = await FAQ.findById(req.params.id).lean();

    if (!faq) {
      return sendErrorResponse(res, 404, "FAQ not found");
    }

    res.json({
      success: true,
      data: faq,
    });
  } catch (error) {
    handleControllerError(res, error, "FAQ.getFAQById", 500, "Failed to fetch FAQ");
  }
};

export const createFAQ = async (req, res) => {
  try {
    // Diagnostic log: show who is calling this route and whether auth header is present
    try {
      console.info('[FAQ.create] invoked by user:', req.user, 'Authorization present=', Boolean(req.headers.authorization));
    } catch (logErr) {
      console.warn('[FAQ.create] failed to log request user');
    }
    const faqData = mapFAQInput(req.body);

    if (!faqData.question || !faqData.answer) {
      return sendErrorResponse(res, 400, "Question and answer are required");
    }

    const faq = new FAQ(faqData);
    await faq.save();

    res.status(201).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    handleControllerError(res, error, "FAQ.createFAQ", 500, "Failed to create FAQ");
  }
};

export const updateFAQ = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return sendErrorResponse(res, 400, "Invalid FAQ ID");
    }

    const faqData = mapFAQInput(req.body);

    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      faqData,
      { new: true, runValidators: true }
    );

    if (!faq) {
      return sendErrorResponse(res, 404, "FAQ not found");
    }

    res.json({
      success: true,
      data: faq,
    });
  } catch (error) {
    handleControllerError(res, error, "FAQ.updateFAQ", 500, "Failed to update FAQ");
  }
};

export const deleteFAQ = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return sendErrorResponse(res, 400, "Invalid FAQ ID");
    }

    const faq = await FAQ.findByIdAndDelete(req.params.id);

    if (!faq) {
      return sendErrorResponse(res, 404, "FAQ not found");
    }

    res.json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    handleControllerError(res, error, "FAQ.deleteFAQ", 500, "Failed to delete FAQ");
  }
};

export const getFAQsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const faqs = await FAQ.find({
      category,
      active: true,
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    handleControllerError(res, error, "FAQ.getFAQsByCategory", 500, "Failed to fetch FAQs");
  }
};
