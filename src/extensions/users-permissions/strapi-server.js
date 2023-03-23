//#################################################GHANNAM###############################################

// This file is used to extend the users-permissions plugin
// It overloades the auth.register controller
// I got the initial implementation from here: node_modules/@strapi/plugin-users-permissions/server/controllers/Auth.js
// I also copied the validateRegisterBody and getService from relevant files in node_modules

//#######################################################################################################

const crypto = require("crypto");
const _ = require("lodash");
const utils = require("@strapi/utils");
const { yup, validateYupSchema } = require("@strapi/utils");
const { ApplicationError, ValidationError } = utils.errors;

const registerSchema = yup.object({
  email: yup.string().email().required(),
  username: yup.string().required(),
  password: yup.string().required(),
});
const validateRegisterBody = validateYupSchema(registerSchema);

const { getAbsoluteAdminUrl, getAbsoluteServerUrl, sanitize } = utils;

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel("plugin::users-permissions.user");

  return sanitize.contentAPI.output(user, userSchema, { auth });
};

module.exports = (plugin) => {
  const getService = (name) => {
    return strapi.plugin("users-permissions").service(name);
  };
  plugin.controllers.auth.register = async (ctx) => {
    console.log("custom register is being used ");
    const pluginStore = await strapi.store({
      type: "plugin",
      name: "users-permissions",
    });

    const settings = await pluginStore.get({ key: "advanced" });

    if (!settings.allow_register) {
      throw new ApplicationError("Register action is currently disabled");
    }

    const params = {
      ..._.omit(ctx.request.body, [
        "confirmed",
        "blocked",
        "confirmationToken",
        "resetPasswordToken",
        "provider",
        "canBuy",
        "canSell",
      ]),
      provider: "local",
    };

    await validateRegisterBody(params);

    const role = await strapi
      .query("plugin::users-permissions.role")
      .findOne({ where: { type: settings.default_role } });

    if (!role) {
      throw new ApplicationError("Impossible to find the default role");
    }

    const { email, username, provider } = params;

    const identifierFilter = {
      $or: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() },
        { username },
        { email: username },
      ],
    };

    const conflictingUserCount = await strapi
      .query("plugin::users-permissions.user")
      .count({
        where: { ...identifierFilter, provider },
      });

    if (conflictingUserCount > 0) {
      throw new ApplicationError("Email or Username are already taken");
    }

    if (settings.unique_email) {
      const conflictingUserCount = await strapi
        .query("plugin::users-permissions.user")
        .count({
          where: { ...identifierFilter },
        });

      if (conflictingUserCount > 0) {
        throw new ApplicationError("Email or Username are already taken");
      }
    }

    const newUser = {
      ...params,
      role: role.id,
      email: email.toLowerCase(),
      username,
      confirmed: !settings.email_confirmation,
    };

    const user = await getService("user").add(newUser);

    const sanitizedUser = await sanitizeUser(user, ctx);

    if (settings.email_confirmation) {
      try {
        await getService("user").sendConfirmationEmail(sanitizedUser);
      } catch (err) {
        throw new ApplicationError(err.message);
      }

      return ctx.send({ user: sanitizedUser });
    }

    const jwt = getService("jwt").issue(_.pick(user, ["id"]));
    console.log("jwt :>> ", jwt);
    return ctx.send({
      jwt,
      user: sanitizedUser,
    });
  };

  return plugin;
};
