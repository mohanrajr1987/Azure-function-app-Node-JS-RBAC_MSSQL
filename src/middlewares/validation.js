import * as yup from 'yup';

export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.validate({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// User validation schemas
export const userSchemas = {
  register: yup.object({
    body: yup.object({
      email: yup.string().email().required(),
      password: yup.string().min(8).required(),
      firstName: yup.string().required(),
      lastName: yup.string().required()
    })
  }),

  login: yup.object({
    body: yup.object({
      email: yup.string().email().required(),
      password: yup.string().required()
    })
  }),

  updateProfile: yup.object({
    body: yup.object({
      firstName: yup.string(),
      lastName: yup.string(),
      password: yup.string().min(8)
    })
  })
};

// Role validation schemas
export const roleSchemas = {
  createRole: yup.object({
    body: yup.object({
      name: yup.string().required(),
      description: yup.string(),
      permissions: yup.array().of(yup.string())
    })
  }),

  updateRole: yup.object({
    body: yup.object({
      name: yup.string(),
      description: yup.string(),
      permissions: yup.array().of(yup.string())
    }),
    params: yup.object({
      id: yup.string().uuid().required()
    })
  }),

  assignRole: yup.object({
    body: yup.object({
      userId: yup.string().uuid().required(),
      roleId: yup.string().uuid().required()
    })
  })
};

// Document validation schemas
export const documentSchemas = {
  uploadDocument: yup.object({
    body: yup.object({
      isPublic: yup.boolean(),
      metadata: yup.object()
    })
  }),

  updateDocument: yup.object({
    body: yup.object({
      isPublic: yup.boolean(),
      metadata: yup.object()
    }),
    params: yup.object({
      id: yup.string().uuid().required()
    })
  })
};
