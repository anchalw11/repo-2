const fmpApiKeys = [
  'ZnGnGJfphMxGlNTg0IY7tzhw0na7he2e', 'cO2So6E9npvl61RJNKDN0XG6vXUOu1M2',
  'YIOfNOSjNVKVXa8AE9RBQzGsj6UR9Jah', 'erobSaiKA8tR2WFMndOc1pqkwKLoS78J',
  'unxQnyeAfT4uQK6tkuue0vG7aMJYdMxS', 'pUKlRtJdiOoHMuCW0mPgVinRlVFVNSWZ',
  'DBk1BuJKwovXNAC2EkX1brFPuwvJDiWj', '0Hh1qcMwCaxAHBFErXZqnUcil3QzkuPe',
  'jlFm01miqXrjVBpJxY2adTBS3CCHiqlg', 'WLI7iICCMGPkzXgzPVXs1xlcXr9K7sdt',
  'eOmLFYVummeVEetf9OQCEUwPDdvT7Bn1', 'iDmalmxS9vwfEOYJemoP2vIuOS3UoXyI',
  'QCz0fKTfOgxxXKVXv6ph1F79nbwflbq4', 'Z8fmhqFqFXXSUvBm8YZomoJ0N8qLgM9C',
  'T1AR0E2RT12TIMV0G5qlXp6j4RPgZ9ys', 'r8JMZ3F6Gub3M1lxt99KRKhspm44vTGn',
  'rsYISbIBZ1SkMAHm6AHWBwo5NHI1CRs2', 'cyIglNi8O49833MOTclMLlWrIfPLX1Dr',
  'Y12xLWM0NRHxo9RKyGj7nZWfkCKoglYc', 'oBhqDxRWExMkCa4z6FZsAb38gzyXl6dV',
  '0miKTpyJeztgI7V9zRwKcF0iS1PO1kij', 'SicQrG60T46GeDBYfh5p06ca7pBplqM5',
  'NQZR5TDerEcLis9cFqny8haVXCgckKHu', 'UvWnk1PGbWtSdVWtdZ9VnqXpmkZMZmrG',
  'DIghlVl2YutPnhujJ1bJilGGnYStyn9Q', 'F9ocT9jVv6KpyNXtPmoVGfslfnlARBbm',
  't2EWXVEQxMUptkAu9cB2eWOlAQx6L17i', 'q1kmGy4T4rsEofIr5ytyVTRz0BqjRKxp',
  'DFayt9kcP23RvXp4XlAqkaXjVbMg6G91', '0q6kOqpXj3ycutxl7VlqgHuDqMhKedF0',
  'yCLDea7t7iUE8dUMx3N7aeLRgZ3O32cy', 'KUcpHx2ufVEWFzxyV3xyBcymLMFwpRbx',
  'WgRLSlQYbjc8hNbUx1DkvMDgloggvakr', 's5LoLUrwKbE401FqLYvv7w3ucKzfCzry',
  'nMmof9S6QCPMb6KRQiLMAX0uP7wEsWyF', 'fzVKjOAl0UZA7sHpge8yMOVaeWYnoaDm',
  '85jakUh6j7ytpavV34V2lsSKyW5hqTmW', 'Y08uhoKaHDHQEWmv1ZAYqgMrHgw6im2W',
  'xjnT5Qx7jogPjLozvi2xAzy6Gf2vPBCn', 'gBhPN7Y5TL40HMirC47KsKaCZy4bbk1B'
];

let currentApiKeyIndex = 0;

const getNextApiKey = () => {
  const apiKey = fmpApiKeys[currentApiKeyIndex];
  currentApiKeyIndex = (currentApiKeyIndex + 1) % fmpApiKeys.length;
  return apiKey;
};

export { getNextApiKey };
