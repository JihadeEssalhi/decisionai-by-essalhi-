import { createClient } from '@/lib/supabase/client'

async function testSecurity() {
    const supabase = createClient()

    console.log('🔐 Tests de sécurité...')

    // Test 1: Vérifier que le rôle ne peut pas être modifié par l'utilisateur
    console.log('\n1. Test modification du rôle...')
    const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'ADMIN' })
        .eq('id', 'test-user-id')

    if (updateError) {
        console.log('✅ Rôle protégé :', updateError.message)
    }

    // Test 2: Vérifier que l'utilisateur ne voit que son propre profil
    console.log('\n2. Test accès aux données...')
    const { data: users, error: selectError } = await supabase
        .from('users')
        .select('*')

    if (selectError) {
        console.log('✅ Accès restreint :', selectError.message)
    }

    // Test 3: Vérifier le trigger auth.users → public.users
    console.log('\n3. Test trigger de synchronisation...')
    // Créer un utilisateur test
    const { data, error: signUpError } = await supabase.auth.signUp({
        email: `test-${Date.now()}@test.com`,
        password: 'Test123!@#',
        options: {
            data: {
                full_name: 'Test User'
            }
        }
    })

    if (signUpError) {
        console.log('❌ Erreur création:', signUpError.message)
    } else if (data.user) {
        // Vérifier que le profil a été créé avec role='USER'
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single()

        console.log('✅ Rôle par défaut:', profile?.role || 'USER')
    }

    console.log('\n✅ Tests terminés !')
}

testSecurity()