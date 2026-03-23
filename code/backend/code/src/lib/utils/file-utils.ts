import * as fs from 'fs';

export function createFile(path: string, name: string, extension: string, content: string): string {
  let _path = path;
  if (_path.endsWith('/')) {
    _path = _path.substring(0, _path.length - 1);
  }
  const fileName = `${_path}/${name}.${extension}`;
  fs.writeFileSync(fileName, content, 'utf8');

  return `${_path}/${name}.${extension}`;
}
