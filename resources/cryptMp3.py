import os


def xor_decrypt(encrypted_data, key=0x6a):
    """使用XOR算法对数据进行解密"""
    return bytes([b ^ key for b in encrypted_data])


# 获取当前目录下所有的MP3文件
mp3_files = [f for f in os.listdir('.') if f.lower().endswith('.mp3')]

# 对每个MP3文件应用解密函数
for mp3_file in mp3_files:
    with open(mp3_file, 'rb') as encrypted_file:
        encrypted_data = encrypted_file.read()

    decrypted_data = xor_decrypt(encrypted_data)

    # 将解密后的数据写入新文件
    decrypted_file_name = f'{mp3_file}'
    with open(decrypted_file_name, 'wb') as decrypted_file:
        decrypted_file.write(decrypted_data)

print("处理完成。")
