/**
 * Evaluator-only snapshot, never model input or a grading source.
 * Columns were enumerated offline from these complete PUBLIC request partitions.
 * SHA-256 partition encoding: JSON.stringify(regions), UTF-8, no trailing newline.
 * Public request hashes are byte hashes of the published files, not the original
 * (pre-sanitization) request hashes retained separately in diagnostic lineage.
 */
export type ComparisonReference = {
  id: string
  size: number
  regions: readonly (readonly string[])[]
  columns: readonly number[]
  partitionSha256: string
  publicRequest: string
  publicRequestSha256: string
  image?: {
    sha256: string
    bytes: number
    assetPath: string
    publicOriginalRequest: string
    publicOriginalRequestSha256: string
    originalRequestSha256: string
    lineageCallId: string
    publicDiagnosticRequestSha256: string
    originalDiagnosticRequestSha256: string
  }
}

export const comparisonLineageManifest = Object.freeze({
  path: 'diagnostic-completion-manifest.json',
  sha256: '3bc42483998fdcbe747afbf4a68a29d50a03132b8cfec29590523d8803bffad8',
})

type Snapshot = Omit<ComparisonReference, 'size' | 'regions'> & { rows: readonly string[] }
const snapshots: readonly Snapshot[] = [
  {
    id: 'queens-5-easy', rows: ['AABBC', 'ABBDD', 'AEBDD', 'AEDDD', 'EEDDD'],
    columns: [5, 3, 1, 4, 2], partitionSha256: 'c748eea809a236f594d548fdc3af0704cbc4a512bd85a12b70e95f82acad9f3d',
    publicRequest: 'runs/2026-09-18-jev-deep-dive/02_batch_5x5_guardrail_enabled/request.json',
    publicRequestSha256: '64cf4ca9e7f7700ee663e73e029c5eb6a342ce803b4453e8f2ef30542e9e9d2a',
    image: {
      sha256: 'd69fec03a223629b71bc71234a5c85b891194ec7f474007310176151fdb9f88c', bytes: 12639,
      assetPath: 'assets/d69fec03a223629b71bc71234a5c85b891194ec7f474007310176151fdb9f88c.png',
      publicOriginalRequest: 'runs/2026-10-01-earlier-generations/r6_queens-5-easy_gpt-4.1/request.json',
      publicOriginalRequestSha256: 'c289f40f3336f151fe2d92e30b6c6a72d84c595ce5f9096031cb2bc3f966af34',
      originalRequestSha256: 'b27862b46664777ed3022ea925a0aba38a4d3565b4e8614c84588922160b3f3c',
      lineageCallId: 'rep1_gpt-4.1__queens-5-easy_region_grid_rows',
      publicDiagnosticRequestSha256: '5b318ec091f4a9fc84555dcee75f81f3c12bd669b72cafe72c18fd00026a2a8f',
      originalDiagnosticRequestSha256: '8c55883d8cd0cab562fbb646c4da666934ba5b51c9e85c745d0764ebca3ea140',
    },
  },
  {
    id: 'queens-7-medium', rows: ['ABBBBCC', 'AAACCCC', 'ADDCCCC', 'DDDCCCC', 'DDDEECF', 'DDDDCCF', 'DDDDGGF'],
    columns: [3, 1, 6, 2, 4, 7, 5], partitionSha256: 'a5369b91da43803ba6b87e481ffb1f48fa28583174d457425ab685c756091a34',
    publicRequest: 'runs/2026-09-19-jev-scale/construction_7/request.json',
    publicRequestSha256: 'fe572990485085838ad008aa7e9e805ac235f4a74a41dc7422231261668275ec',
    image: {
      sha256: '2291954e941b22ca2b09534186ca001374ad67a43dbde41b80aebedc8825d179', bytes: 17502,
      assetPath: 'assets/2291954e941b22ca2b09534186ca001374ad67a43dbde41b80aebedc8825d179.png',
      publicOriginalRequest: 'runs/2026-10-01-earlier-generations/r6_queens-7-medium_gpt-4.1/request.json',
      publicOriginalRequestSha256: '41db9061c0dffe1da6f6965157e347b40a1eda9dbf338ea74c7926a2b78b0dec',
      originalRequestSha256: 'a0822ef50cd6565775e5769e6914e5d9dfab802a2f51894adec753a738dc690b',
      lineageCallId: 'rep1_gpt-4.1__queens-7-medium_region_grid_rows',
      publicDiagnosticRequestSha256: 'd94e4ca4b5cf8c0c8738fc6bc0ad785590c8be485b9b8de333ddea12a7122430',
      originalDiagnosticRequestSha256: 'd4ea097f92a6dfa8636adbec475884e338dbd47f99ffe47d2f2697a79defeebe',
    },
  },
  {
    id: 'queens-9-hard', rows: ['ABBBBCCCC', 'ABBBBBCCC', 'ABBDABCCC', 'AAAAAAEAA', 'FAAAGAAAH', 'AAAAGGAHH', 'AGGGGGGGH', 'AGGGGGGII', 'AGGGGGGII'],
    columns: [6, 2, 4, 7, 1, 3, 9, 5, 8], partitionSha256: '26d185312791d0712da679a975e94d4923263e2c403a8a6f7db388fe66c10dad',
    publicRequest: 'runs/2026-09-19-jev-scale/construction_9/request.json',
    publicRequestSha256: '3ded741cead0be087fbcac39584b3e6777bfe277c39ac83370e7bfd56107a0d1',
    image: {
      sha256: '838551d0904b556d3e93b69ddb25da6a018c90fd348cd1194652cdbb7b4647ea', bytes: 21424,
      assetPath: 'assets/838551d0904b556d3e93b69ddb25da6a018c90fd348cd1194652cdbb7b4647ea.png',
      publicOriginalRequest: 'runs/2026-10-01-earlier-generations/r6_queens-9-hard_gpt-4.1/request.json',
      publicOriginalRequestSha256: '306f89edc634e409342c8e2402c696aa04f27eed571bbf8467d4caefa57a9f88',
      originalRequestSha256: '29e105cb84a0bc6f0e1462dfecd58e264f80e1874f74f05d4e1a62d18a3dbec9',
      lineageCallId: 'rep1_gpt-4.1__queens-9-hard_region_grid_rows',
      publicDiagnosticRequestSha256: 'ece6207ff75edc2d9f7471cf5b0f8b5b3a92c3746374fc55812c8c9b14f84a52',
      originalDiagnosticRequestSha256: 'd282d265c1b56bbcdb78b0cbe15cce2fbeb59e66effe57282c1b324096116bdf',
    },
  },
  {
    id: 'sequence-5-1', rows: ['AAAAB', 'AAAAA', 'AAACC', 'DEECC', 'EEEEE'], columns: [5, 2, 4, 1, 3],
    partitionSha256: '44e1c2e23af73505975041a3cf734cca7cdc6e165efcef5663e34d92e7f53719',
    publicRequest: 'runs/2026-09-30-jev-trajectories/sequence-5-1_raw_a1_p01_region/request.json',
    publicRequestSha256: '9f3f7511c7ba3f99f7117665b7dd7404f15a122d82cef77f66699971deb0f872',
  },
  {
    id: 'sequence-5-2', rows: ['ABBBC', 'ACCCC', 'AAADC', 'AADDD', 'AEDDD'], columns: [3, 5, 1, 4, 2],
    partitionSha256: 'd1a63319427ee3d48f2bd69411f8956c1b32e1daedb45148394a4cd138107c23',
    publicRequest: 'runs/2026-09-30-jev-trajectories/sequence-5-2_raw_a1_p01_region/request.json',
    publicRequestSha256: 'a3a4773cd439fbc785e647756f92fd138f0e672d75646c6a37174a2e865ebe91',
  },
  {
    id: 'sequence-5-3', rows: ['ABBBC', 'AABBD', 'AAAAD', 'AEDDD', 'EEEDD'], columns: [5, 3, 1, 4, 2],
    partitionSha256: '00da5af49285e55f3d29e7923133608acfacfe663b50c628954d0232e9444290',
    publicRequest: 'runs/2026-09-30-jev-trajectories/sequence-5-3_raw_a1_p01_region/request.json',
    publicRequestSha256: 'ae2a5b282945ce16ce0a81eac286c089bd4a8bc4bd9c880abcf5385f993bef1f',
  },
  {
    id: 'sequence-7-1', rows: ['ABAACCC', 'AAAACCC', 'DDAACCC', 'DDDCCCC', 'DEECCCE', 'FEEEEEE', 'EEEEGGE'], columns: [2, 4, 6, 3, 7, 1, 5],
    partitionSha256: 'c966ecaf9aadb99dcbb20faa940d60766dae320588d6f0f1bca1b621b9c2b786',
    publicRequest: 'runs/2026-09-30-jev-trajectories/sequence-7-1_raw_a1_p01_region/request.json',
    publicRequestSha256: '3ca0875d86952c4d4d47fb284928379a29de839a01d3e5f4c1f1c070c3807886',
  },
  {
    id: 'sequence-7-2', rows: ['AABBBBB', 'CABBBBB', 'CBBBBBB', 'CCDBEEF', 'CCDDEEE', 'DDDDEEG', 'DDDDGGG'], columns: [2, 4, 1, 7, 5, 3, 6],
    partitionSha256: '5de35b4f160eec493fd29d1c77e1585a0a6fa7896b259e1ac18bc62b6ac1e8fe',
    publicRequest: 'runs/2026-09-30-jev-trajectories/sequence-7-2_raw_a1_p01_region/request.json',
    publicRequestSha256: '07c08bbc6c0e4d61c4447893aeb1665bc835ff3280ce35127a3d9e850776b8a6',
  },
  {
    id: 'sequence-7-3', rows: ['AAABBCC', 'AAADDCC', 'AAADDDC', 'EEAAAFF', 'EEEAAFF', 'EEEAFFF', 'GGGGGFF'], columns: [4, 7, 5, 3, 1, 6, 2],
    partitionSha256: '737c87616d75c90c856c81503d809bbcf6185cca7d45ab25a649f879bb253356',
    publicRequest: 'runs/2026-09-30-jev-trajectories/sequence-7-3_raw_a1_p01_region/request.json',
    publicRequestSha256: '328e8bfacb84d38dc85c9d4512df071113f85314f324a804bd2e0821796b2b4f',
  },
  {
    id: 'sequence-9-1', rows: ['ABBBCCCCC', 'AADCCCCEE', 'ADDCCCEEE', 'DDCCCCFEE', 'GDCCCHEEE', 'GGHCCHHEE', 'GGHHHHEEE', 'GGHHHEEEE', 'GGGHHHEEI'], columns: [4, 1, 3, 7, 5, 8, 6, 2, 9],
    partitionSha256: '557a71390d5e2bb287e522bef3017359d9d919f314e79392b91565f4521e2f4d',
    publicRequest: 'runs/2026-09-30-jev-trajectories/sequence-9-1_raw_a1_p01_region/request.json',
    publicRequestSha256: 'c1151e17e6c7fdb27caf219c4d69c35333332043feecd3d63f970819e82e8d9e',
  },
  {
    id: 'sequence-9-2', rows: ['ABBBBBBCC', 'BBBDDDDCC', 'BBDDDCCCC', 'BBDDDCECC', 'FDDGDCEEE', 'FFFGDGHEE', 'FFGGGGEEE', 'FGGGGGGEE', 'FGGIGGGEE'], columns: [1, 3, 8, 5, 9, 7, 2, 6, 4],
    partitionSha256: '9d87e36963e9a6f8594cec0c8ba0c4ee09b603a2bb76b4b7a197a30395cfdc44',
    publicRequest: 'runs/2026-09-30-jev-trajectories/sequence-9-2_raw_a1_p01_region/request.json',
    publicRequestSha256: '9aecfef92cc240df129d5e01e36e00ac1eb94f1fb2aa3ccb43315b4f66939c42',
  },
  {
    id: 'sequence-9-3', rows: ['AAABBBCDD', 'AABBBBBDD', 'EAABBBDDD', 'EFABBGGDD', 'FFFBGGGGD', 'FFFFGGGDD', 'FFFFHDGDD', 'FFFFFDDDD', 'FFIIIDDDD'], columns: [7, 2, 6, 1, 8, 3, 5, 9, 4],
    partitionSha256: '7e6c7df3f7a430da349199a1207443e39dff8672214ced4be08e00f89e1a878c',
    publicRequest: 'runs/2026-09-30-jev-trajectories/sequence-9-3_raw_a1_p01_region/request.json',
    publicRequestSha256: '0bafd1996d72195d2e0e04c5d2cd2fe72647fe51752d36e3fec0fd9acb0ca540',
  },
]

/** Frozen references cannot be changed by viewer consumers. */
export const comparisonReferences: readonly ComparisonReference[] = Object.freeze(snapshots.map(({ rows, ...entry }) => Object.freeze({
  ...entry,
  size: rows.length,
  regions: Object.freeze(rows.map(row => Object.freeze(row.split('')))),
  columns: Object.freeze([...entry.columns]),
  ...(entry.image ? { image: Object.freeze({ ...entry.image }) } : {}),
})))
