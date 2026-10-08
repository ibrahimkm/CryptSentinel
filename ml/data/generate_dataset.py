"""
Synthetic Behavioral Dataset Generator for AICS Ransomware Detection Research
Generates labeled behavioral feature vectors representing Benign vs. Ransomware-like activities.
All data is strictly synthetic and modeled after known behavioral profiles.
"""

import os
import random
import pandas as pd
import numpy as np

def generate_behavioral_dataset(num_samples=1500, seed=42):
    np.random.seed(seed)
    random.seed(seed)

    records = []
    half = num_samples // 2

    # 1. Generate Benign Samples
    for i in range(half):
        # Normal office work, IDE compiling, web browsing, occasional zip archiving
        is_archive_workload = random.random() < 0.08  # 8% benign archive compression edge case

        if is_archive_workload:
            files_mod = int(np.random.normal(8, 3))
            files_crt = int(np.random.normal(2, 1))
            files_del = 0
            mut_rate = max(0.5, np.random.normal(3.5, 1.0))
            avg_ent = np.clip(np.random.normal(7.3, 0.2), 6.8, 7.85)  # High entropy due to zip/gzip
            max_ent = np.clip(avg_ent + np.random.uniform(0.1, 0.2), 7.0, 7.9)
            ent_delta = avg_ent - 4.2
            high_ent_ratio = np.clip(np.random.normal(0.6, 0.15), 0.3, 0.9)
            susp_ext = 0  # Crucial: standard benign extensions (.zip, .tar.gz)
            ext_changes = 0
            cpu = np.clip(np.random.normal(35, 10), 10, 70)
            mem = np.clip(np.random.normal(180, 40), 60, 400)
            burst_dur = max(1.5, np.random.normal(8.0, 3.0))
        else:
            files_mod = max(1, int(np.random.poisson(4)))
            files_crt = max(0, int(np.random.poisson(1.5)))
            files_del = max(0, int(np.random.poisson(0.3)))
            mut_rate = max(0.1, np.random.exponential(0.8))
            avg_ent = np.clip(np.random.normal(4.2, 0.8), 1.5, 6.2)
            max_ent = np.clip(avg_ent + np.random.uniform(0.2, 0.8), 2.0, 6.8)
            ent_delta = avg_ent - 4.2
            high_ent_ratio = np.clip(np.random.beta(0.5, 8.0), 0.0, 0.15)
            susp_ext = 0
            ext_changes = 1 if random.random() < 0.05 else 0
            cpu = np.clip(np.random.normal(8, 5), 0.5, 30)
            mem = np.clip(np.random.normal(90, 30), 20, 300)
            burst_dur = max(2.0, np.random.uniform(5.0, 30.0))

        tot_bytes = max(1024, int(files_mod * np.random.lognormal(9.5, 1.2)))
        avg_fsize = max(512.0, tot_bytes / max(1, files_mod))
        active_proc = int(np.random.normal(140, 25))

        records.append({
            'files_modified': max(0, files_mod),
            'files_created': max(0, files_crt),
            'files_deleted': max(0, files_del),
            'mutations_per_second': round(float(mut_rate), 2),
            'average_entropy': round(float(avg_ent), 3),
            'maximum_entropy': round(float(max_ent), 3),
            'entropy_delta': round(float(ent_delta), 3),
            'high_entropy_file_ratio': round(float(high_ent_ratio), 3),
            'suspicious_extension_count': int(susp_ext),
            'extension_change_count': int(ext_changes),
            'total_bytes_modified': int(tot_bytes),
            'average_file_size': round(float(avg_fsize), 1),
            'process_cpu': round(float(cpu), 1),
            'process_memory': round(float(mem), 1),
            'number_of_active_processes': max(10, active_proc),
            'burst_duration': round(float(burst_dur), 2),
            'label': 'BENIGN'
        })

    # 2. Generate Ransomware-like Samples
    for i in range(half):
        files_mod = int(np.random.normal(85, 30))
        files_crt = int(np.random.normal(70, 25))
        files_del = int(np.random.normal(55, 20))
        mut_rate = max(6.0, np.random.normal(28.0, 10.0))
        avg_ent = np.clip(np.random.normal(7.72, 0.15), 7.25, 7.99)
        max_ent = np.clip(avg_ent + np.random.uniform(0.05, 0.2), 7.5, 8.0)
        ent_delta = avg_ent - 4.2
        high_ent_ratio = np.clip(np.random.normal(0.92, 0.06), 0.70, 1.0)
        susp_ext = max(2, int(np.random.normal(files_crt * 0.85, 10)))
        ext_changes = max(3, int(np.random.normal(files_mod * 0.90, 10)))
        tot_bytes = max(50000, int(files_mod * np.random.lognormal(11.2, 1.0)))
        avg_fsize = max(2048.0, tot_bytes / max(1, files_mod))
        cpu = np.clip(np.random.normal(72, 15), 35, 99.5)
        mem = np.clip(np.random.normal(320, 80), 120, 850)
        active_proc = int(np.random.normal(145, 30))
        burst_dur = max(0.5, np.random.exponential(3.2))

        records.append({
            'files_modified': max(1, files_mod),
            'files_created': max(1, files_crt),
            'files_deleted': max(0, files_del),
            'mutations_per_second': round(float(mut_rate), 2),
            'average_entropy': round(float(avg_ent), 3),
            'maximum_entropy': round(float(max_ent), 3),
            'entropy_delta': round(float(ent_delta), 3),
            'high_entropy_file_ratio': round(float(high_ent_ratio), 3),
            'suspicious_extension_count': int(susp_ext),
            'extension_change_count': int(ext_changes),
            'total_bytes_modified': int(tot_bytes),
            'average_file_size': round(float(avg_fsize), 1),
            'process_cpu': round(float(cpu), 1),
            'process_memory': round(float(mem), 1),
            'number_of_active_processes': max(10, active_proc),
            'burst_duration': round(float(burst_dur), 2),
            'label': 'RANSOMWARE_LIKE'
        })

    # Shuffle dataset
    random.shuffle(records)
    df = pd.DataFrame(records)
    return df

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(script_dir, 'training_data.csv')
    df = generate_behavioral_dataset(1500, seed=42)
    df.to_csv(out_path, index=False)
    print(f"[Dataset Generator] Successfully generated {len(df)} synthetic behavioral records.")
    print(f"[Dataset Generator] Saved to: {out_path}")
    print(f"[Dataset Generator] Class Distribution:\n{df['label'].value_counts()}")
