'use client';
import Image from '@tiptap/extension-image';
import {NodeViewWrapper,ReactNodeViewRenderer,type NodeViewProps} from '@tiptap/react';
function ImageView({node,updateAttributes,deleteNode,selected}:NodeViewProps){
 const a=node.attrs;
 return <NodeViewWrapper as="figure" className={'editor-image'+(selected?' is-selected':'')} contentEditable={false}><img src={a.src} alt={a.alt||a.caption||'Ảnh trong bài'} loading="lazy" draggable data-drag-handle/><div className="editor-image-caption"><input aria-label="Chú thích ảnh trong bài" placeholder="Viết chú thích ảnh…" value={a.caption||''} maxLength={500} onChange={e=>updateAttributes({caption:e.target.value,alt:e.target.value.slice(0,240)})}/><button type="button" className="text-button" onClick={deleteNode} aria-label="Gỡ ảnh khỏi bài">Gỡ ảnh</button></div></NodeViewWrapper>;
}
export const ArticleImage=Image.extend({
 addAttributes(){return {...this.parent?.(),assetId:{default:null},caption:{default:''}};},
 parseHTML(){return [{tag:'img[src^="/api/cms/assets/"]',getAttrs:element=>({assetId:(element as HTMLImageElement).getAttribute('src')?.split('/').pop()})}];},
 addNodeView(){return ReactNodeViewRenderer(ImageView);},
});
