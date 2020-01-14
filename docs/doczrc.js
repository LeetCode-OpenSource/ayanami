export default {
  typescript: true,
  files: './**/*.mdx',
  title: 'Ayanami document',
  dest: 'public',
  themeConfig: {
    colors: {
      header: {
        bg: 'tomato',
      },
    },
    styles: {
      inlineCode: {
        color: 'hotpink',
      }
    },
  },
  menu: [
    'Introduction',
    {
      name: 'Basic',
      menu: [
        'Concept',
        {
          name: 'Action',
          route: '/en/basic/action',
        },
        {
          name: 'Effects',
          route: '/en/basic/effects',
        },
        {
          name: 'Dependencies Injection',
          route: '/en/basic/dependencies-injection'
        }
      ],
    },
    {
      name: 'Recipes',
      menu: [
        'Cancellation',
        'Loading/Error states handling',
        'StateSelector',
        'Dependencies Replacement',
        'Adding new module asynchronously',
        'Writting tests',
      ],
    },
    {
      name: 'FAQ',
      route: '/en/faq'
    },
    {
      name: '基本概念',
      menu: [
        '概念',
        {
          name: 'Action',
          route: '/zh/basic/action',
        },
        {
          name: 'Effects',
          route: '/zh/basic/effects',
        },
        {
          name: '依赖注入',
          route: '/zh/basic/dependencies-injection'
        }
      ],
    },
    {
      name: '深入',
      menu: [
        '取消',
        '处理 Loading/Error 状态',
        'StateSelector',
        '依赖替换',
        'Module 异步加载',
        '测试',
      ],
    },
    {
      name: '常见问题',
      route: '/zh/faq'
    },
  ],
}
