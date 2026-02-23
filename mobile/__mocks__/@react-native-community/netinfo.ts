const NetInfoMock = {
  addEventListener: jest.fn().mockImplementation(callback => {
    callback({ isConnected: true, isInternetReachable: true })
    return jest.fn() // unsubscribe fn
  }),
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
}

export default NetInfoMock
