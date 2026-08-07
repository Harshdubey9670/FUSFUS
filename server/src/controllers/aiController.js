const aiService = require('../services/aiService');
const User = require('../models/User');

exports.chatAssistant = async (req, res, next) => {
  try {
    const { prompt, conversationHistory } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });
    const data = await aiService.chatAssistant(prompt, conversationHistory);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.generateImage = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });
    const data = await aiService.generateImage(prompt);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.generateCaption = async (req, res, next) => {
  try {
    const { topic, tone } = req.body;
    const data = await aiService.generateCaption(topic, tone);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.generateHashtags = async (req, res, next) => {
  try {
    const { topic } = req.body;
    const data = await aiService.generateHashtags(topic);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.generateBio = async (req, res, next) => {
  try {
    const { niche, vibe } = req.body;
    const data = await aiService.generateBio(niche, vibe);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.suggestUsernames = async (req, res, next) => {
  try {
    const { name, interest } = req.body;
    const data = await aiService.suggestUsernames(name, interest);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.generatePostIdeas = async (req, res, next) => {
  try {
    const { category } = req.body;
    const data = await aiService.generatePostIdeas(category);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.suggestComments = async (req, res, next) => {
  try {
    const { postContext } = req.body;
    const data = await aiService.suggestComments(postContext);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.translateText = async (req, res, next) => {
  try {
    const { text, targetLang } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });
    const data = await aiService.translateText(text, targetLang);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.moderateContent = async (req, res, next) => {
  try {
    const { text } = req.body;
    const data = await aiService.moderateContent(text);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.detectFakeAccount = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const userProfile = targetUserId ? await User.findById(targetUserId) : req.user;
    const data = await aiService.detectFakeAccount(userProfile);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.generateAltText = async (req, res, next) => {
  try {
    const { imageDescription } = req.body;
    const data = await aiService.generateAltText(imageDescription);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};
