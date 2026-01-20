
export type Dictionary = typeof dictionaries.id;

export const dictionaries = {
    id: {
        common: {
            add: 'Tambah',
            cancel: 'Batal',
            save: 'Simpan',
            delete: 'Hapus',
            edit: 'Ubah',
            loading: 'Memuat...',
            error: 'Terjadi kesalahan',
            select: 'Pilih',
        },
        nav: {
            brand: 'KBM Timework',
            features: 'Fasilitas',
            howItWorks: 'Alur Naskah',
            faq: 'Info',
            projects: 'Daftar Alur Naskah',
            myTasks: 'Tugas Saya',
            protocols: 'SOP Penerbitan',
            superAdmin: 'Super Admin',
            signIn: 'Masuk',
            signOut: 'Keluar',
            getStarted: 'Lihat Alur Naskah',
            projectForm: 'Formulir Alur Naskah',
        },
        protocol: {
            titlePlaceholder: 'Ketik judul tugas baru...',
            daysPlaceholder: 'Hari',
            noAssignee: 'Tanpa Penanggung Jawab',
            add: 'Tambah',
            noSteps: 'Belum ada langkah. Tambahkan tugas pertama di atas.',
            loginTip: '*User wajib login sekali untuk muncul.',
            sidebar: {
                menuTitle: 'Menu Protokol',
                workflow: 'Alur Kerja ({steps})',
                form: 'Formulir Input',
                tipsTitle: 'Tips Pro',
                tip1: 'Gunakan <b>kurung kurawal</b> seperti <code>{author}</code> pada Pola Judul untuk pengisian otomatis.',
                tip2: 'Tambahkan opsi <b>"Custom"</b> di Dropdown agar user bisa mengetik nilai sendiri.',
                tip3: 'Gunakan <b>Hidden</b> pada field yang ingin diisi otomatis tapi disembunyikan dari user.'
            }
        },
        project: {
            title: 'Alur Naskah Aktif',
            subtitle: 'Pantau progres penerbitan buku dan kelola tim redaksi.',
            newProject: 'Alur Naskah Baru',
            createTitle: 'Input Alur Naskah Baru',
            nameLabel: 'Judul Buku',
            protocolLabel: 'Jenis Terbitan (SOP)',
            cancel: 'Batal',
            create: 'Buat Proyek',
            noProjects: 'Belum ada Alur Naskah',
            noProjectsDesc: 'Mulai dengan input Alur Naskah pertama Anda sesuai SOP.',
            updated: 'Diperbarui',
            tasks: 'Tugas',
            fastTrack: 'Mode Cepat (Satuan)',
            fastTrackDesc: 'Alur kerja yang disederhanakan untuk pesanan satuan.',
            markDone: 'Tandai Selesai',
            endOfWorkflow: 'Akhir Alur Kerja',
            loadMore: 'Muat Lebih Banyak',
            loadingMore: 'Memuat...',
            deleteConfirm: 'Apakah Anda yakin ingin menghapus proyek ini? Tindakan ini tidak dapat dibatalkan.',
            deleteSuccess: 'Proyek berhasil dihapus',
            deleteError: 'Gagal menghapus proyek',
            status: {
                ACTIVE: 'Aktif',
                COMPLETED: 'Selesai',
                LOCKED: 'Terkunci',
                IN_PROGRESS: 'Sedang Dikerjakan',
                DONE: 'Selesai',
                OPEN: 'Terbuka'
            },
            detail: {
                project: 'Proyek',
                progress: 'Progres',
                tasksCompleted: 'tugas selesai',
                back: 'Kembali',
                settings: 'Aksi',
                teamMembers: 'Anggota Tim',
                noDescription: 'Tidak ada deskripsi.',
                activityLog: 'Log Aktivitas',
                take: 'Ambil',
                reopen: 'Buka Kembali',
                done: 'Selesai',
                lockAssignments: 'Kunci Penugasan',
                unlockAssignments: 'Buka Kunci Penugasan',
                waitsFor: 'Menunggu:',
                noDetails: 'Tidak ada detail',
                clickToExpand: 'Klik untuk melihat detail',
                clickToCollapse: 'Klik untuk menutup',
                descriptionPlaceholder: 'Deskripsi...',
                skipped: 'Dilewati',
            },
            searchPlaceholder: 'Cari Alur Naskah...',
            allProtocols: 'Semua SOP',
            allStatus: 'Semua Status'
        },
        formBuilder: {
            title: 'Pengaturan Formulir Proyek',
            subtitle: 'Sesuaikan field data yang diperlukan saat membuat proyek baru.',
            addField: 'Tambah Field',
            save: 'Simpan Template',
            saving: 'Menyimpan...',
            label: 'Label',
            key: 'Key (ID)',
            type: 'Tipe',
            required: 'Wajib Diisi',
            options: 'Opsi (pisahkan koma)',
            remove: 'Hapus Field',
            types: {
                text: 'Teks Pendek',
                number: 'Angka',
                select: 'Pilihan (Dropdown)',
                date: 'Tanggal',
                checkboxGroup: 'Checkbox Group'
            },
            placeholders: {
                label: 'Contoh: Nama Lengkap',
                key: 'Contoh: full_name',
                options: 'Opsi A, Opsi B, Opsi C'
            },
            validation: {
                empty: 'Semua field harus memiliki Label dan Key (ID)',
                success: 'Template formulir berhasil disimpan',
                error: 'Gagal menyimpan template formulir'
            }
        },
        protocolLibrary: {
            title: 'Pustaka Protokol',
            subtitle: 'Standarisasi alur kerja Anda dengan template yang dapat digunakan kembali.',
            createTitle: 'Buat Protokol Baru',
            nameLabel: 'Nama',
            namePlaceholder: 'Contoh: Standar Cetak Buku',
            descLabel: 'Deskripsi',
            descPlaceholder: 'Deskripsi protokol...',
            createButton: 'Buat Protokol',
            noProtocols: 'Tidak ada protokol ditemukan. Buat satu untuk memulai.',
            steps: 'Langkah',
            noDesc: 'Tidak ada deskripsi.',
            updated: 'Update:',
        },
        myTasks: {
            title: 'Tugas Aktif Saya',
            subtitle: 'Halo {name}, Anda memiliki {count} tugas aktif.',
            allCaughtUp: 'Semua beres!',
            noActiveTasks: 'Tidak ada tugas aktif yang diberikan kepada Anda.',
            openProject: 'Buka Proyek →'
        },
        home: {
            badge: 'v1.0 sekarang live',
            title: 'Sistem Penerbitan Otomatis.',
            titleHighlight: 'Fokus Alur Naskah, Bukan Drama.',
            subtitle: 'KBM Timework mengawal setiap naskah dari masuk, editing, layout, hingga cetak. Saat editor selesai, layouter langsung dapat notifikasi.',
            openProjects: 'Lihat Dashboard',
            viewProtocols: 'Cek SOP',
            features: {
                title: 'Dapur Redaksi Modern',
                subtitle: 'Semua alat yang dibutuhkan tim KBM untuk menerbitkan buku berkualitas lebih cepat.',
                standardized: {
                    title: 'SOP Anti Lupa',
                    desc: 'Setiap tahap penerbitan (editing, proofing, layout) sudah ada checklist-nya.'
                },
                dependencies: {
                    title: 'Alur Terjaga',
                    desc: 'Layout tidak bisa mulai sebelum naskah selesai diedit. Mencegah kerja dua kali.'
                },
                parallel: {
                    title: 'Transparansi Tim',
                    desc: 'Editor, Layouter, dan Desainer tahu persis status naskah tanpa perlu rapat terus-menerus.'
                },
                automated: {
                    title: 'Otomatisasi Status',
                    desc: 'Status naskah berubah otomatis saat checklist terpenuhi.'
                },
                sync: {
                    title: 'Sinkronisasi Data',
                    desc: 'Perubahan judul atau penulis langsung terupdate di semua divisi.'
                },
                audit: {
                    title: 'Jejak Digital',
                    desc: 'Riwayat revisi dan aktivitas tercatat lengkap. Aman dari saling lempar tanggung jawab.'
                }
            },
            howItWorks: {
                title: 'Alur Naskah',
                subtitle: 'Sederhana, Terstandar, Cepat.',
                steps: {
                    define: {
                        title: '1. Input Alur Naskah',
                        desc: 'Admin menerima naskah dan memilih jenis terbitan (Mayor/Indie/Satuan).'
                    },
                    execute: {
                        title: '2. Proses Redaksi',
                        desc: 'Tim editor, layouter, dan desainer mengerjakan bagiannya sesuai urutan SOP.'
                    },
                    automate: {
                        title: '3. Siap Cetak',
                        desc: 'Setelah semua checklist hijau, naskah siap naik cetak tanpa revisi berulang.'
                    }
                }
            },
            faq: {
                title: 'Pertanyaan Umum',
                items: {
                    free: {
                        q: 'Siapa yang bisa akses?',
                        a: 'Sistem ini khusus untuk karyawan internal dan mitra Penerbit KBM.'
                    },
                    team: {
                        q: 'Bagaimana jika ada revisi?',
                        a: 'Cukup reject status pada tahap tersebut, naskah akan kembali ke tahap sebelumnya.'
                    },
                    limit: {
                        q: 'Bisa untuk buku satuan?',
                        a: 'Bisa. Gunakan SOP "Cetak Satuan" untuk alur yang lebih ringkas.'
                    }
                }
            },
            footer: {
                brand: 'Penerbit KBM',
                desc: 'Menerbitkan mimpi, mencerdaskan bangsa.',
                copyright: '© 2024 Penerbit KBM. Internal System.',
                links: {
                    twitter: 'Instagram',
                    github: 'Website'
                },
                developedBy: 'Dikembangkan oleh {name} dari {company}'
            }
        },
    },
    en: {
        common: {
            add: 'Add',
            cancel: 'Cancel',
            save: 'Save',
            delete: 'Delete',
            edit: 'Edit',
            loading: 'Loading...',
            error: 'Something went wrong',
            select: 'Select',
        },
        nav: {
            brand: 'KBM Timework',
            features: 'Features',
            howItWorks: 'How it Works',
            faq: 'FAQ',
            projects: 'Projects',
            myTasks: 'My Tasks',
            protocols: 'Protocols',
            superAdmin: 'Super Admin',
            signIn: 'Sign In',
            signOut: 'Sign Out',
            getStarted: 'Get Started',
            projectForm: 'Project Form',
        },
        protocol: {
            titlePlaceholder: 'Type new task title...',
            daysPlaceholder: 'Days',
            noAssignee: 'No Assignee',
            add: 'Add',
            noSteps: 'No steps defined. Add the first task above.',
            loginTip: '*User must login once to appear.',
            sidebar: {
                menuTitle: 'Protocol Menu',
                workflow: 'Workflow ({steps})',
                form: 'Intake Form',
                tipsTitle: 'Pro Tips',
                tip1: 'Use <b>curly braces</b> like <code>{author}</code> in the Title Pattern to auto-fill project names.',
                tip2: 'Add <b>"Custom"</b> as an option in Dropdowns to let users type their own value.',
                tip3: 'Toggle <b>Hidden</b> on fields you want to pre-fill logically but hide from users (advanced).'
            }
        },
        protocolLibrary: {
            title: 'Protocol Library',
            subtitle: 'Standardize your workflows with reusable templates.',
            createTitle: 'Create New Protocol',
            nameLabel: 'Name',
            namePlaceholder: 'e.g., Book Printing Standard',
            descLabel: 'Description',
            descPlaceholder: 'Protocol description...',
            createButton: 'Create Protocol',
            noProtocols: 'No protocols found. Create one to get started.',
            steps: 'Steps',
            noDesc: 'No description provided.',
            updated: 'Upd:',
        },
        project: {
            title: 'Active Projects',
            subtitle: "Track progress and manage your team's workflow.",
            newProject: 'New Project',
            createTitle: 'Create New Project',
            nameLabel: 'Project Name',
            protocolLabel: 'Select Protocol (Template)',
            cancel: 'Cancel',
            create: 'Create Project',
            noProjects: 'No projects yet',
            noProjectsDesc: 'Get started by creating your first project from a protocol template.',
            updated: 'Updated',
            tasks: 'Tasks',
            fastTrack: 'Fast Track Mode',
            fastTrackDesc: 'Simplified workflow for Satuan orders.',
            markDone: 'Mark Done',
            endOfWorkflow: 'End of Workflow',
            loadMore: 'Load More Projects',
            loadingMore: 'Loading...',
            deleteConfirm: 'Are you sure you want to delete this project? This cannot be undone.',
            deleteSuccess: 'Project deleted',
            deleteError: 'Failed to delete project',
            status: {
                ACTIVE: 'Active',
                COMPLETED: 'Completed',
                LOCKED: 'Locked',
                IN_PROGRESS: 'In Progress',
                DONE: 'Done',
                OPEN: 'Open'
            },
            detail: {
                project: 'Project',
                progress: 'Progress',
                tasksCompleted: 'tasks completed',
                back: 'Back',
                settings: 'Action',
                teamMembers: 'Team Members',
                noDescription: 'No description provided.',
                activityLog: 'Activity Log',
                take: 'Take',
                reopen: 'Reopen',
                done: 'Done',
                lockAssignments: 'Lock Assignments',
                unlockAssignments: 'Unlock Assignments',
                waitsFor: 'Waits for:',
                noDetails: 'No details',
                clickToExpand: 'Click to expand details',
                clickToCollapse: 'Click to collapse',
                descriptionPlaceholder: 'Description...',
                skipped: 'Skipped',
            },
            searchPlaceholder: 'Search projects...',
            allProtocols: 'All Protocols',
            allStatus: 'All Status'
        },
        formBuilder: {
            title: 'Project Form Settings',
            subtitle: 'Customize the data fields required when creating a new project.',
            addField: 'Add Field',
            save: 'Save Template',
            saving: 'Saving...',
            label: 'Label',
            key: 'Key (ID)',
            type: 'Type',
            required: 'Required Field',
            options: 'Options (comma separated)',
            remove: 'Remove Field',
            types: {
                text: 'Text Input',
                number: 'Number Input',
                select: 'Dropdown (Select)',
                date: 'Date Picker',
                checkboxGroup: 'Checkbox Group'
            },
            placeholders: {
                label: 'e.g. Full Name',
                key: 'e.g. full_name',
                options: 'Option A, Option B, Option C'
            },
            validation: {
                empty: 'All fields must have a Label and a Key (ID)',
                success: 'Form template saved successfully',
                error: 'Failed to save form template'
            }
        },
        myTasks: {
            title: 'My Active Tasks',
            subtitle: 'Hello {name}, you have {count} active items on your deck.',
            allCaughtUp: 'All caught up!',
            noActiveTasks: 'No active tasks assigned to you.',
            openProject: 'Open Project →'
        },
        home: {
            badge: 'v1.0 is now live',
            title: 'Automated Operations.',
            titleHighlight: 'Zero Coordination.',
            subtitle: 'KBM Timework turns your SOPs into executable protocols. When one step finishes, the next unlocks automatically. No more checking in.',
            openProjects: 'Start Shipping',
            viewProtocols: 'See Examples',
            features: {
                title: 'Supercharge your workflow',
                subtitle: 'Everything you need to ship projects faster, all in one place.',
                standardized: {
                    title: 'Impossible to Forget',
                    desc: 'Complex workflows become simple checklists. Ensure quality without micromanagement.'
                },
                dependencies: {
                    title: 'Auto-Unlock',
                    desc: 'Tasks remain locked until prerequisites are met. Prevents skipping steps and confusion.'
                },
                parallel: {
                    title: 'Visual Progress',
                    desc: 'See exactly where every project is stuck. Eliminate bottlenecks instantly.'
                },
                automated: {
                    title: 'Automated Execution',
                    desc: 'Protocols run themselves. Just set the rules and watch it go.'
                },
                sync: {
                    title: 'Real-time Sync',
                    desc: 'Changes propagate instantly across your team.'
                },
                audit: {
                    title: 'Audit Trails',
                    desc: 'Track every action and revert changes with a click.'
                }
            },
            howItWorks: {
                title: 'How it Works',
                subtitle: 'Simple, yet powerful.',
                steps: {
                    define: {
                        title: '1. Define',
                        desc: 'Create a protocol template once. Set steps and dependencies.'
                    },
                    execute: {
                        title: '2. Execute',
                        desc: 'Start a project from the template. Your team gets assigned instantly.'
                    },
                    automate: {
                        title: '3. Automate',
                        desc: 'The system unlocks the next tasks automatically when prerequisites are met.'
                    }
                }
            },
            faq: {
                title: 'Frequently Asked Questions',
                items: {
                    free: {
                        q: 'Is it free?',
                        a: 'Yes, KBM Timework is free for individuals and small teams. We want to help you work efficiently.'
                    },
                    team: {
                        q: 'Can I invite my team?',
                        a: 'Absolutely. You can invite unlimited team members to your projects.'
                    },
                    limit: {
                        q: 'Are there project limits?',
                        a: 'There are currently no limits on the number of projects you can create.'
                    }
                }
            },
            footer: {
                brand: 'KBM Timework',
                desc: 'The new standard for team operations.',
                copyright: '© 2024 KBM Timework. All rights reserved.',
                links: {
                    twitter: 'Twitter',
                    github: 'GitHub'
                },
                developedBy: 'Developed by {name} from {company}'
            }
        }
    }
};
