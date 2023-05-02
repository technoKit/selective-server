module.exports = ({ env }) => ({
  // enable a plugin that doesn't require any configuration
  i18n: true,

  "google-map-picker": {
    config: {
      apiKey: env("GOOGLE_PUBLIC_KEY"), // required
      default_center: { lat: 54.106438, lng: 11.55694 }, // required
      favorites_places: [
        {
          title: "Cairo",
          coordinates: { lat: 30.0444, lng: 31.2357 },
        },
        {
          title: "Alexandria",
          coordinates: { lat: 31.2001, lng: 29.9187 },
        },
      ],
    },
  },
  upload: {
    config: {
      provider: "cloudinary",
      providerOptions: {
        cloud_name: env("CLOUDINARY_NAME"),
        api_key: env("CLOUDINARY_KEY"),
        api_secret: env("CLOUDINARY_SECRET"),
      },
      actionOptions: {
        upload: {},
        delete: {},
      },
    },
  },
  email: {
    config: {
      provider: "sendgrid",
      providerOptions: {
        apiKey: env("SENDGRID_API_KEY"),
      },
      settings: {
        defaultFrom: "a.a.ganam2@gmail.com",
        defaultReplyTo: "a.a.ganam2@gmail.com",
      },
    },
  },
  wysiwyg: {
    enabled: true,
    resolve: "./src/plugins/wysiwyg", // path to plugin folder
  },
});
