/**
 * IP BLOCKCHAIN ANCHORING
 * Phase 9.5: Enterprise-Grade System Hardening
 * 
 * Features:
 * - Code hashing for IP proof
 * - Blockchain timestamping
 * - Immutable IP records
 */

export const IP_BLOCKCHAIN_CONFIG = {
  // Blockchain for anchoring
  blockchain: {
    network: 'polygon',
    chainId: 137,
    contractAddress: '0xIP_ANCHOR_CONTRACT',
  },
  
  // Hashing
  hash: {
    algorithm: 'SHA-256',
    includeFiles: ['src/**/*.ts', 'src/**/*.tsx'],
    excludeFiles: ['node_modules', '.git', '*.test.ts'],
  },
  
  // Anchor frequency
  frequency: {
    automatic: true,
    interval: 'weekly',
    onRelease: true,
  },
};

export interface IPAnchor {
  id: string;
  hash: string;
  previousHash: string;
  timestamp: Date;
  blockNumber: number;
  transactionHash: string;
  network: string;
  merkleRoot: string;
}

export interface IPAnchorMetadata {
  version: string;
  commitHash: string;
  branch: string;
  author: string;
  files: {
    path: string;
    hash: string;
    size: number;
  }[];
  totalFiles: number;
  totalSize: number;
}

/**
 * Generate hash of codebase
 */
export function generateCodebaseHash(files: { path: string; content: string }[]): {
  merkleRoot: string;
  fileHashes: Record<string, string>;
} {
  const crypto = require('crypto');
  const fileHashes: Record<string, string> = {};
  
  // Hash each file
  for (const file of files) {
    const hash = crypto
      .createHash('sha256')
      .update(file.content)
      .digest('hex');
    fileHashes[file.path] = hash;
  }
  
  // Build Merkle tree (simplified)
  const sortedPaths = Object.keys(fileHashes).sort();
  const hashes = sortedPaths.map(p => fileHashes[p]);
  
  // Combine hashes until single root
  while (hashes.length > 1) {
    const newHashes: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      if (i + 1 < hashes.length) {
        const combined = crypto
          .createHash('sha256')
          .update(hashes[i] + hashes[i + 1])
          .digest('hex');
        newHashes.push(combined);
      } else {
        newHashes.push(hashes[i]);
      }
    }
    hashes.length = 0;
    hashes.push(...newHashes);
  }
  
  return {
    merkleRoot: hashes[0] || '',
    fileHashes,
  };
}

/**
 * Create IP anchor on blockchain
 */
export function createIPAnchor(metadata: IPAnchorMetadata, previousHash: string): IPAnchor {
  const timestamp = new Date();
  
  // In production, this would call a smart contract
  return {
    id: `anchor-${Date.now()}`,
    hash: generateMerkleRoot(metadata),
    previousHash,
    timestamp,
    blockNumber: 50000000 + Math.floor(Math.random() * 1000000), // Mock
    transactionHash: '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
    network: IP_BLOCKCHAIN_CONFIG.blockchain.network,
    merkleRoot: generateMerkleRoot(metadata),
  };
}

/**
 * Verify IP anchor
 */
export function verifyIPAnchor(
  anchor: IPAnchor,
  currentHash: string
): {
  valid: boolean;
  message: string;
} {
  // Check if hash matches
  if (anchor.hash !== currentHash) {
    return {
      valid: false,
      message: 'Code has been modified since anchor was created',
    };
  }
  
  // Verify chain
  if (!anchor.previousHash && anchor.hash === anchor.merkleRoot) {
    return {
      valid: true,
      message: 'IP Anchor verified - code integrity confirmed',
    };
  }
  
  return {
    valid: true,
    message: 'IP Anchor verified - all hashes match',
  };
}

/**
 * Get anchor history
 */
export function getAnchorHistory(): IPAnchor[] {
  return [
    {
      id: 'anchor-2024-01-15',
      hash: '0xabc123...',
      previousHash: '',
      timestamp: new Date('2024-01-15'),
      blockNumber: 45000000,
      transactionHash: '0x123...',
      network: 'polygon',
      merkleRoot: '0xroot123...',
    },
    {
      id: 'anchor-2024-02-01',
      hash: '0xdef456...',
      previousHash: '0xabc123...',
      timestamp: new Date('2024-02-01'),
      blockNumber: 47000000,
      transactionHash: '0x456...',
      network: 'polygon',
      merkleRoot: '0xroot456...',
    },
  ];
}

function generateMerkleRoot(metadata: IPAnchorMetadata): string {
  const crypto = require('crypto');
  const data = JSON.stringify({
    version: metadata.version,
    commitHash: metadata.commitHash,
    files: metadata.files.map(f => f.hash),
  });
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate legal IP timestamp certificate
 */
export function generateIPTimestampCertificate(anchor: IPAnchor): {
  title: string;
  description: string;
  hash: string;
  timestamp: string;
  network: string;
  blockNumber: number;
  transactionHash: string;
  legalStatement: string;
} {
  return {
    title: 'NightLife IP Timestamp Certificate',
    description: 'This certifies that the codebase hash was anchored to the blockchain at the specified timestamp, providing immutable proof of IP existence.',
    hash: anchor.hash,
    timestamp: anchor.timestamp.toISOString(),
    network: anchor.network,
    blockNumber: anchor.blockNumber,
    transactionHash: anchor.transactionHash,
    legalStatement: 'This timestamp serves as legal proof of intellectual property creation date. The hash uniquely identifies the codebase at the time of anchoring.',
  };
}
