import PaymentMethod from "../models/paymentMethod.js";

async function getPaymentMethods(req, res, next) {
  try {
    const paymentMethods = await PaymentMethod.find({
      isActive: true,
    }).populate("user");
    res.json(paymentMethods);
  } catch (error) {
    next(error);
  }
}

async function getPaymentMethodById(req, res, next) {
  try {
    const id = req.params.id;
    const paymentMethod = await PaymentMethod.findById(id).populate("user");
    if (!paymentMethod) {
      return res.status(404).json({ message: "No se encontró el método de pago" });
    }
    res.json(paymentMethod);
  } catch (error) {
    next(error);
  }
}

async function getPaymentMethodsByUser(req, res, next) {
  try {
    const userId = req.user.id;
    const paymentMethods = await PaymentMethod.find({
      user: userId,
      isActive: true,
    });
    res.json(paymentMethods);
  } catch (error) {
    next(error);
  }
}

async function createPaymentMethod(req, res, next) {
  try {
    const user = req.user.id;
    const {
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault = false,
    } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Se requiere el tipo de método de pago." });
    }
    if (isDefault) {
      await PaymentMethod.updateMany(
        { user: user, isDefault: true },
        { isDefault: false }
      );
    }

    const newPaymentMethodData = {
      user,
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault,
    };
    const newPaymentMethod = await PaymentMethod.create(newPaymentMethodData);
    res.status(201).json(newPaymentMethod);
  } catch (error) {
    next(error);
  }
}

async function updatePaymentMethod(req, res, next) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const paymentMethod = await PaymentMethod.findOneAndUpdate(
      { _id: id, user: userId },
      updateData,
      { new: true }
    );
    if (!paymentMethod) {
      return res
        .status(404)
        .json({
          message:
            "No se ha encontrado el método de pago o no tienes permiso para actualizarlo.",
        });
    }
    res.status(200).json(paymentMethod);
  } catch (error) {
    next(error);
  }
}

async function setDefaultPaymentMethod(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const paymentMethod = await PaymentMethod.findOne({
      _id: id,
      user: userId,
    });
    if (!paymentMethod) {
      return res.status(404).json({ message: "No se encontró el método de pago" });
    }
    await PaymentMethod.updateMany({ user: userId }, { isDefault: false });
    paymentMethod.isDefault = true;
    await paymentMethod.save();
    res.status(200).json(paymentMethod);
  } catch (error) {
    next(error);
  }
}

async function deactivatePaymentMethod(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updatedPaymentMethod = await PaymentMethod.findOneAndUpdate(
      { _id: id, user: userId },
      { isActive: false, isDefault: false },
      { new: true }
    );
    if (!updatedPaymentMethod) {
      return res.status(404).json({ message: "No se encontró el método de pago" });
    }
    res.status(200).json(updatedPaymentMethod);
  } catch (error) {
    next(error);
  }
}

async function deletePaymentMethod(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const deletedPaymentMethod = await PaymentMethod.findOneAndDelete({
      _id: id,
      user: userId,
    });
    if (!deletedPaymentMethod) {
      return res.status(404).json({ message: "No se encontró el método de pago" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function getDefaultPaymentMethod(req, res, next) {
  try {
    const userId = req.user.id;
    const defaultPaymentMethod = await PaymentMethod.findOne({
      user: userId,
      isDefault: true,
      isActive: true,
    });
    if (!defaultPaymentMethod) {
      return res
        .status(404)
        .json({ message: "No se ha encontrado ningún método de pago predeterminado." });
    }
    res.json(defaultPaymentMethod);
  } catch (error) {
    next(error);
  }
}

export {
  getPaymentMethods,
  getPaymentMethodById,
  getPaymentMethodsByUser,
  createPaymentMethod,
  updatePaymentMethod,
  setDefaultPaymentMethod,
  deactivatePaymentMethod,
  deletePaymentMethod,
  getDefaultPaymentMethod,
};
