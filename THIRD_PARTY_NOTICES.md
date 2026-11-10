# Third-party notices

Block Atlas's original source code is licensed under the [MIT License](LICENSE). Third-party components, including the fonts shipped with the website, **retain their own licenses**.

The complete copyright notices and license texts are stored in [`public/third-party-licenses.txt`](public/third-party-licenses.txt). Vite copies that file into the published site's root, where it is linked in the footer. These notices do not imply that the original third-party projects endorse Block Atlas.

| Component (locked version) | License | Source |
| --- | --- | --- |
| Manrope variable font (`@fontsource-variable/manrope` 5.3.0) | SIL OFL-1.1 | [Google Fonts / Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) |
| Space Grotesk variable font (`@fontsource-variable/space-grotesk` 5.3.0) | SIL OFL-1.1 | [Google Fonts / Space Grotesk](https://github.com/google/fonts/tree/main/ofl/spacegrotesk) |
| Lucide icons (`lucide-react` 1.71.0) | ISC; select Feather-derived icons also MIT | [Lucide](https://github.com/lucide-icons/lucide/blob/main/LICENSE) |
| React (`react` 19.3.1) and React DOM (`react-dom` 19.3.1) | MIT | [React](https://github.com/react/react/blob/main/LICENSE) |
| React Scheduler (`scheduler` 0.28.0) | MIT | [React](https://github.com/react/react/blob/main/LICENSE) |
| Three.js (`three` 0.187.0) | MIT | [Three.js](https://github.com/mrdoob/three.js/blob/master/LICENSE) |
| Tween.js (`@tweenjs/tween.js` 23.1.3) | MIT | [Tween.js](https://github.com/tweenjs/tween.js/blob/main/LICENSE) |
| meshoptimizer (`meshoptimizer` 1.1.1) | MIT | [meshoptimizer](https://github.com/zeux/meshoptimizer/blob/master/LICENSE.md) |

Versions and the licenses of all other development/build dependencies are recorded in [`package-lock.json`](package-lock.json); build tools are not distributed as part of the deployed website. If the dependency tree changes, regenerate and verify the notices before publishing.
