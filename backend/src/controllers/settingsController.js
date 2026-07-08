// src/controllers/settingsController.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @desc    Get company settings
 * @route   GET /api/settings/company
 * @access  Private
 */
exports.getCompanySettings = async (req, res, next) => {
  try {
    let settings = await prisma.companySettings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.companySettings.create({
        data: {
          companyName: "My Company",
          currency: "SAR",
          timezone: "Asia/Riyadh",
          dateFormat: "dd/mm/yyyy",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update company settings
 * @route   PUT /api/settings/company
 * @access  Private (Admin)
 */
exports.updateCompanySettings = async (req, res, next) => {
  try {
    const {
      companyName,
      address,
      taxId,
      phone,
      email,
      website,
      currency,
      timezone,
      dateFormat,
      logo,
    } = req.body;

    let settings = await prisma.companySettings.findFirst();

    const updateData = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (address !== undefined) updateData.address = address;
    if (taxId !== undefined) updateData.taxId = taxId;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;
    if (currency !== undefined) updateData.currency = currency;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (dateFormat !== undefined) updateData.dateFormat = dateFormat;
    if (logo !== undefined) updateData.logo = logo;

    if (settings) {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      settings = await prisma.companySettings.create({
        data: {
          companyName: companyName || "My Company",
          ...updateData,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
