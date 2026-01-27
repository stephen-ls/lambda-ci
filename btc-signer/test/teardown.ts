const teardown = async () => {
  await global.localStackContainer?.stop();
};

export default teardown;
